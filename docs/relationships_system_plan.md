# İlişkiler Sistemi (Relationships System) Tasarımı

## Hedef (Goal Description)
Oyuna kapsamlı bir "İlişkiler Sistemi" eklemek. Bu sistem oyuncunun ailesi (anne, baba), sosyal çevresi ve romantik ilişkileri ile olan etkileşimlerini yönetecek. Yeni eklenen tüm kurallar oyunun mevcut dinamiklerine tam uyumlu olarak tasarlanmıştır.

## Sistem Kuralları ve Dinamikleri

### 1. Zaman Akışı ve İhmal Mekaniği
* **Zaman Akışı:** Oyunda tur atlama mantığı ile her "Yıl Atla" işlemi **1 in-game Yıl** olarak kabul edilir. Ortalama her 2 yılda 1 büyük bir ilişki event'i çıkar.
* **İlişki İhmali (Zaman Aşımı):** Bir karakterle **2 yıl boyunca (2 tur)** hiç etkileşime girilmezse ilişki barı belirli bir miktar düşer.
* **Küsme Durumu:** Anne ve babada boşanma veya ilişkinin tamamen bitmesi gibi bir mekanik yoktur. Ancak, birinin ilişki barı **0'a iner** ve bunun üzerine **2 yıl daha** (toplamda son etkileşimden 4 yıl sonra) etkileşime girilmezse, ekrana o kişi (anne, baba veya eski date) gelip sert şeyler söyler ve durumu "**Küs / Nefret Ediyor**" statüsüne geçer. Küs karakterlerle yapılan her etkileşim girişimi kesinlikle başarısız olur.

### 2. Karakter Yapısı
* **Temel Özellikler:** İsim, Yaş, İlişki Seviyesi (Progress Bar).
* **Ekstra Rastgele Özellikler:** Sosyal mekanlarda tanışılan karakterlerin rastgele gizli karakter özellikleri/statları olacak (Örn: cömert, sinirli, kurnaz vb.). Bu özellikler, diyalog eventlerindeki belli seçeneklerin sonucunu ve başarı oranını doğrudan etkileyecek.

### 3. Aile Mekanikleri (Anne ve Baba)
* **Para İste:** Başarı oranı (% şans) her zaman sabit kalacaktır. Ancak başarılı olunduğunda alınan paranın miktarı, oyundaki **enflasyon ile güncellenmiş rastgele bir aralıkta** belirlenecektir.
* **Dışarı Çık / Gez:** İlişkiyi artırır veya özel diyalogları tetikler.
* **Yatırım Tavsiyesi İste:** %50 ihtimalle piyasa ("fısıltılar") hakkında doğru tüyo verir.
* **Miras Olayı:** Anne veya baba belirli bir yaşa gelip vefat ettiğinde (sürpriz event), oyuncuya geriye bir "Miras" (para veya gayrimenkul) bırakması kesindir. 

### 4. Sosyal Etkileşimler, Meslekler ve Keşif Sistemi
* **Sosyal Mekanlar:** Sahil, AVM, Dağ Gezisi vb. etkinliklere gidildiğinde **%50 ihtimalle** yeni biriyle tanışma kartı çıkar (Seçenekler: Date'e Çağır, Arkadaş Ol, Görmezden Gel).
* **Arkadaşlık ve Networking Faydası:** 
  * "Arkadaş Ol" seçeneğiyle listeye eklenen kişilerin rastgele meslekleri olur. Bir kısmı oyunda işimize yaramayacak, sadece rol yapma amaçlı sıradan mesleklerken; bir kısmı da (örneğin Emlakçı) özel meslekler olur.
  * Eğer özel bir mesleği varsa (Örn: Ucuza ev satan emlakçı arkadaş), bu karakterlerin bize sağladığı büyük fırsat veya ekstra bonus olayı, **o karakter başına oyun boyunca en fazla 1 kere** denk gelecek şekilde sınırlanacaktır.

### 5. Romantik İlişki Evrimi (Date -> Marriage -> Child)
* **Çoklu İlişkiler ve Yakalanma:** 
  * Oyuncu istediği kadar kişiyle "Date" aşamasında olduğunu sanabilir.
  * Eğer halihazırda (1.) bir Date varken, gidip (2.) yeni bir kişiyi daha Date'e çağırır ve kabul edilirse: 1. Date aniden ekrana gelip büyük olay çıkarır. İlişkiler listesinden tamamen silinmez ancak statüsü "**Küs / Nefret Ediyor**" olarak değişir ve bir daha düzeltilemez.
  * *Alternatif Yakalanma:* "Yıl Atla" yapıldığında rastgele event olarak, 2 veya daha fazla date'in aynı anda karşılaştığı komik ve dramatik bir olay yaşanır. Her ikisinin de ilişki barı **sıfırlanır**.
* **Evlilik ve Nafaka:** İlişki barı dolduğunda evlenilir. Evlendikten ve çocuk yaptıktan sonra, sadakatsizlik gibi bir sebeple ilişkinin patlaması (boşanma) yaşanırsa, oyuncuya kesinlikle **Nafaka ödeme** zorunluluğu bağlanır (Her tur eksi bakiye yazar).
* **Çocuk Yapma:** Evlendikten sonra çocuk yapılır, yaşı her tur 1 artarak takip edilir. Çocuğun para kazandırması mekaniği **şimdilik yoktur**.

### 6. Event (Olay) ve Diyalog Sistemi
* Her ortalama **2 oyuniçi yılda 1** kez, tüm ilişkileri veya yaşları kapsayan olaylar havuzundan bir event tetiklenir.
* **Kayınvalide / Kayınpeder Borç Olayı:**
  * Evlendikten sonra eşinizin ailesi sizden borç para isteyebilir.
  * Borç verip vermeme kararınız doğrudan eşinizle ilişkinizi etkiler.
  * Borç vermeyi seçerseniz, paranın geri dönme ihtimali **%50'dir**. Zamanı geldiğinde ekranda ya "Şanslısın, borcu geri verdiler" mesajı ve para dönüşü, ya da "Geri verecek gibi durmuyorlar, geçmiş olsun" mesajı ile para kaybı yaşanır.

## İleriye Dönük Eklentiler (Future Enhancements)
* *Hediye ve Envanter Entegrasyonu:* Oyunun ilerleyen aşamalarında envanter veya lüks tüketim sistemi geliştiğinde, sahip olunan arabayı veya alınan pırlantayı partnere hediye ederek ilişki barını tek seferde çok fazla artırma mekaniği sisteme eklenecektir. (Şimdilik yapılmayacak, ileriye dönük not olarak eklendi).
