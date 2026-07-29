# AI Agent Mimarisi

Bu belge FINSIM'in Sprint 3 AI agents katmanını açıklar. Agentlar yalnızca eğitim metni üretir; para, portföy, event sonucu, skor ve ekonomi hesapları oyun motorunda kalır.

## Akış

```text
6 intro cevabı -> Profile Agent -> bias vektörü + intro hikayesi
event seçimi  -> Bias Coach   -> gerektiğinde kısa koç yorumu
oyun geçmişi  -> Final Report -> davranışsal finans değerlendirmesi
final rapor   -> Learning Plan -> 2-3 eğitim konusu ve oyun pratiği
```

Her metin agentı önce deterministik bir fallback hazırlar. `GEMINI_API_KEY` tanımlıysa Gemini daha doğal bir metin üretmeyi dener. Anahtar yoksa, servis hata verirse veya safety kontrolü çıktıyı reddederse fallback kullanılır. LLM oyun durumunu değiştiremez.

## LangChain Orkestrasyonu

### Oturum Hafızası

`memory_agent.py`, mevcut `event_history` verisinden karar sayısını, bias tekrarlarını ve son üç kararı çıkarır. Hafıza sözleşmesi ayrıca `profile_bias_scores` ve son üç `previous_coach_insights` alanını taşır. Bu hafıza yalnızca açık oyun oturumu kapsamındadır; kişisel veri saklamaz ve oyun ekonomisini değiştirmez. Bias Coach bu deterministik özeti Gemini promptunda kullanır; Final Report aynı özeti response içinde taşır. Gemini kapalıysa özet response içinde kalır ve kural tabanlı agentlar çalışmaya devam eder.

Frontend, profil ile AI karar/koç/final rapor kayıtlarını `finsim_agent_memory_v1` anahtarıyla yerel tarayıcı hafızasında saklar. Her kayıt `session_id` taşır; yeni intro tamamlandığında veya "Tekrar Oyna" işleminde yeni bir session açılarak eski koç/final/event geçmişinin yeni oyuna sızması engellenir. Agent memory mevcut oyun oturumu ve `session_id` üzerinden çalışır. Tüm oyun state restore edilmediği için sayfa yenileme sonrası eski oyuna otomatik dönme hedeflenmez. Bu kayıt para, portföy veya ekonomi motorunun sahibi değildir.

`backend/agents/orchestrator.py`, küçük LangChain `RunnableLambda` zincirleriyle bir agentın çıktısını sıradaki adıma aktarır. LangGraph kullanılmaz; Sprint 3 sunumunda takip edilebilecek üç açık akış vardır:

```text
profile: Profile Agent
coach:   Decision Analyst -> RAG -> Bias Coach -> Safety
final:   Final Report -> RAG/Safety -> Learning Plan -> Safety
```

Endpointler `ajan_akisini_calistir` üzerinden bu zincirleri çalıştırır. `langchain_core` import edilemezse aynı adımlar saf Python ile sırayla yürütülür. LangChain çalışma sırasında hata verirse endpoint kırılmaz; akış Python ile yeniden çalıştırılır. `orchestration` alanı sırasıyla `langchain_runnable`, `python_fallback` veya `python_fallback_after_langchain_error` değerini döndürür.

## Gemini Yapılandırması

Lokal `.env` dosyası commitlenmez:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
REQUIRE_LLM=false

LANGCHAIN_API_KEY=
LANGCHAIN_TRACING_V2=false
LANGCHAIN_PROJECT=finsim-ai-agents
```

`backend/agents/llm_client.py`, Gemini REST `generateContent` çağrısını yapar. Anahtar hiçbir response, log veya prompt alanında döndürülmez. Testler ağ bağlantısı ve API anahtarı gerektirmez.

`REQUIRE_LLM=false` sunum dayanıklılığı için güvenli fallback'e izin verir; LLM hatası response içinde `generation_source: llm_error` ve hassas bilgi içermeyen `llm_error_type` ile görünür kalır. `REQUIRE_LLM=true` olduğunda API anahtarı eksikse veya LLM üretimi başarısızsa agent endpointi kontrollü `503` döndürür. Frontend response içindeki güvenli fallback'i gösterir ve kullanıcıya AI yanıtının üretilemediğini bildirir.

## Bias Sözleşmesi

Kanonik etiketler `backend/agents/bias_catalog.py` içinde tek yerde tutulur. Örnek aliaslar:

- `herding` -> `herd_behavior`
- `asiri_ozguven` -> `overconfidence`
- `status_quo` -> `status_quo_bias`
- `batik_maliyet` -> `sunk_cost`
- `ahlaki_tehlike` -> `moral_hazard`
- `dogrulama_yanliligi` -> `confirmation_bias`

Bu normalizasyon koç ve final raporda aynı davranışın farklı adlarla bölünmesini önler.

## Local RAG

`backend/agents/data/rag_sources.json`, davranışsal finans çalışmalarının kısa Türkçe kaynak kartlarını içerir. Her kartta kimlik, bias etiketi, başlık, yazar, yıl, URL/dosya adı, özet, kullanan agentlar ve oyun içi kullanım alanı bulunur.

`rag_service.py`, ignore edilen `research/pdfs/` klasöründeki PDF'leri `pypdf` ile sayfa sayfa okur. PDF dosya adları `rag_sources.json` içindeki `source` alanlarıyla eşleşir. Metin yaklaşık 1200 karakterlik ve 180 karakter örtüşmeli parçalara ayrılır. Her parçada kaynak kimliği, sayfa numarası, bias etiketleri ve agent kullanım alanı korunur.

Embedding katmanı `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` modelini kullanır. Bu model Türkçe sorgular için çok dilli semantik temsil üretir. Model yerelde yoksa ve indirmeye izin verilmemişse aynı akış deterministik `hash_embedding` fallback'iyle çalışır; testler daima bu çevrimdışı yolu kullanır. `FINSIM_ALLOW_MODEL_DOWNLOAD=true` yalnız modeli ilk kez lokal cache'e almak istendiğinde açılmalıdır.

Chunk metinleri ve embedding vektörleri `.rag_cache/rag_index.json` içinde yerel bir indeks olarak saklanır. PDF değişikliklerinin dosya boyutu ve değiştirilme zamanı fingerprint'e katıldığı için kaynaklar değişince indeks yeniden oluşturulur. Hem PDF klasörü hem indeks `.gitignore` içindedir; ham PDF veya çıkarılmış uzun metin commitlenmez.

Sorgu sırasında bias etiketi, event başlığı, seçilen seçenek, Decision Analyst kanıtı ve session memory birlikte embedding'e çevrilir. Cosine similarity ile sıralanan sonuçlara kanonik bias eşleşmesi küçük bir öncelik puanı ekler. Agent adı filtresi kaynakların yanlış akışta kullanılmasını engeller. Bias Coach en fazla iki farklı kaynaktan, Final Report ve Learning Plan en fazla üç farklı kaynaktan passage alır.

PDF, `pypdf`, embedding modeli veya yerel indeks kullanılamazsa `rag_sources.json` içindeki doğrulanmış kısa Türkçe kaynak kartları devreye girer. Böylece RAG kalitesi düşse bile oyun ve agent endpointleri kırılmaz.

Kaynak seti genel davranışsal finans çalışmalarına ek olarak batık maliyet için Arkes-Blumer (1985), statüko yanlılığı için Samuelson-Zeckhauser (1988), bugünü tercih etme için Laibson (1997), ahlaki tehlike için Holmström (1979) ve doğrulama yanlılığı için Nickerson (1998) çalışmalarını içerir. Nickerson kaydı doğrulanmış kaynak kartı olarak kullanılır; ilgili ham PDF yerelde yoksa başka bir PDF yanlış etiketlenmez.

Yerel yapılandırma:

```dotenv
FINSIM_RAG_DIR=research/pdfs
FINSIM_RAG_CACHE=.rag_cache/rag_index.json
FINSIM_EMBEDDING_BACKEND=sentence_transformers
FINSIM_EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
FINSIM_EMBEDDING_BATCH_SIZE=8
FINSIM_EMBEDDING_GROUP_SIZE=1
FINSIM_ALLOW_MODEL_DOWNLOAD=false
```

## Agentlar

### Profile Agent

Altı intro sorusundaki `bias_skor` değerlerini beş boyutlu başlangıç vektörüne çevirir. Baskın başlangıç eğilimi intro hikayesini kişiselleştirir. `0` değerleri geçerli veri kabul edilir ve varsayılanla değiştirilmez. Boş cevap listesinde nötr skorlar korunur ve `bias_scores_are_neutral: true` ile işaretlenir; bu skorlar Final Report'ta intro kanıtı sayılmaz. Baskın bias seçilmez, hayali karar detayı üretilmez ve Gemini çağrısı yapılmaz.

### Bias Coach

Frontend koça güncel event ile birlikte `event_history` gönderir. Koç ilk karar, yeni bias, aynı biasın her üçüncü tekrarı, yüksek etkili karar ve her beş karar ölçütlerinde konuşur. Diğer anlarda `should_show: false` döner ve frontend paneli göstermez.

Koçtan önce çalışan Decision Analyst; eventin genel bias etiketini seçilen seçenek metni, seçenek etkileri ve karar geçmişiyle doğrular. Güçlü bir çelişki varsa daha uygun etikete geçer; kanıt yoksa yeni bir bias uydurmaz. Ardından `detected_bias`, Türkçe bias adı, karar kanıtı, etki seviyesi, toplam karar sayısı ve tekrar sayısını üretir. RAG ve Bias Coach bu yapılandırılmış çıktıyı kullanır; ekonomi veya event sonucunu değiştirmez.

### Final Report

Başlangıç bias skoruyla oyun içinde gerçekten gözlenen bias için birleşik skor:

```text
birleşik skor = başlangıç skoru * 0.30 + oyun skoru * 0.70
```

Yalnızca bir veri türü varsa mevcut skor doğrudan kullanılır. Hiç veri yoksa `dominant_bias: null` ve `dominant_bias_name_tr: "Yeterli veri yok"` döner. Rapor başlığı `Davranışsal Finans Değerlendirmesi`dir; klinik veya psikolojik tanı iddiası yoktur.

Intro anketi ölçtüğü beş temel eğilim için başlangıç skoru üretir. Final Report ise bias kataloğundaki on bir eğilimin tamamını oyun geçmişinden değerlendirebilir; introda ölçülmeyen `overconfidence`, `herd_behavior`, `status_quo_bias`, `sunk_cost`, `moral_hazard` ve `confirmation_bias` yalnız gerçek oyun kanıtı varsa skora girer.

### Learning Plan

Final rapordaki baskın eğilime göre kaynaklardan 2-3 eğitim konusu ve oyun içinde uygulanabilecek gözlem alıştırmaları seçer. Orkestrasyon sonucu bu veri final response içindeki `learning_plan` alanına eklenir.

### Safety

`safety_agent.py`; kesin al/sat yönlendirmesi, portföye ekleme önerisi, garanti veya güvenli getiri iddiası, klinik teşhis, psikolojik tanı ve küçümseyici dili denetler. Safety adımı yalnız sonuç raporlamaz; kontrol geçmezse Coach, Final Report ve Learning Plan çıktısını güvenli rule-based fallback ile değiştirir. Standalone `learning-plan` endpointi de aynı güvenli learning plan helper'ından döner.

## API Uçları

| İşlem | İngilizce | Türkçe |
| --- | --- | --- |
| Profil | `POST /agents/profile` | `POST /ajanlar/profil` |
| Koç | `POST /agents/coach` | `POST /ajanlar/koc` |
| Final rapor | `POST /agents/final-report` | `POST /ajanlar/final-rapor` |
| Öğrenme planı | `POST /agents/learning-plan` | `POST /ajanlar/ogrenme-plani` |

Sprint 2 endpointleri ve frontend'in kullandığı response alanları korunur. `llm_prompt_payload` gibi geliştirici alanları production response veya arayüzde gösterilmez.
