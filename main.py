from crewai import Agent, Task, Crew
from crewai.llm import LLM
from crewai_tools import SerperDevTool
from dotenv import load_dotenv
import os

# Groq uyumsuzluk hatası için geçici çözüm
import crewai.llms.cache as _crewai_cache
_crewai_cache.mark_cache_breakpoint = lambda msg: msg

load_dotenv()

llm = LLM(model="groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))
arama_araci = SerperDevTool()

arastirmaci = Agent(
    role="Araştırmacı",
    goal="Verilen konu hakkında güncel ve doğru bilgi toplamak",
    backstory="Sen güncel gelişmeleri web'den araştıran, güvenilir bir araştırmacısın.",
    tools=[arama_araci],
    llm=llm
)

editor = Agent(
    role="Editör",
    goal="Toplanan bilgileri akıcı bir makaleye dönüştürmek",
    backstory="Sen karmaşık bilgileri sade, akıcı bir dille anlatan deneyimli bir editörsün.",
    llm=llm
)

seo = Agent(
    role="SEO Uzmanı",
    goal="Makale için başlık ve anahtar kelime önermek",
    backstory="Sen içeriklerin arama motorlarında görünür olmasını sağlayan bir SEO uzmanısın.",
    llm=llm
)

KONU = "2026'da yapay zeka ajanlarının iş dünyasındaki etkisi"

arastirma_gorevi = Task(
    description=f"{KONU} hakkında web'de araştırma yap, 3-4 önemli bilgi/gelişme bul.",
    expected_output="Madde madde, kaynak belirtilerek 3-4 bilgi.",
    agent=arastirmaci
)

yazma_gorevi = Task(
    description="Araştırmacının bulduğu bilgileri kullanarak akıcı bir makale yaz.",
    expected_output="4-6 paragraflık, başlıksız bir makale metni.",
    agent=editor,
    context=[arastirma_gorevi]
)

seo_gorevi = Task(
    description="Yazılan makale için bir başlık ve 3-5 anahtar kelime öner.",
    expected_output="Bir başlık ve anahtar kelime listesi.",
    agent=seo,
    context=[yazma_gorevi]
)

crew = Crew(
    agents=[arastirmaci, editor, seo],
    tasks=[arastirma_gorevi, yazma_gorevi, seo_gorevi]
)

crew.kickoff()

# Her task'ın kendi çıktısına .output ile erişebilirsin
makale = yazma_gorevi.output.raw
seo_bilgisi = seo_gorevi.output.raw

tam_icerik = f"{seo_bilgisi}\n\n---\n\n{makale}"

with open("crewai_makale_ciktisi.md", "w", encoding="utf-8") as dosya:
    dosya.write(tam_icerik)

print("Makale kaydedildi!")
print(tam_icerik)