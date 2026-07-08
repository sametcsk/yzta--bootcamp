import random
import math
from .utils import normal

def enflasyon_sim(rejim, sakin_yil, kriz_mevcut, kriz_dusus_hizi):
    if rejim == 0:
        kriz_olasiligi = 1 - math.exp(-0.04 * sakin_yil)
        if random.random() < kriz_olasiligi and sakin_yil >= 3:
            rejim = 1
            sakin_yil = 0
            kriz_mevcut = normal(63, 8, min_val=50, max_val=80)
            kriz_dusus_hizi = normal(27, 5, min_val=18, max_val=38)
            enf = normal(kriz_mevcut, 4, min_val=kriz_mevcut*0.9, max_val=kriz_mevcut*1.1)
            durum = "KRİZ"
        else:
            sakin_yil += 1
            enf = normal(9.5, 2.8, min_val=5, max_val=18)
            durum = "sakin"
    else:
        gercek_dusus = normal(kriz_dusus_hizi, 5, min_val=18, max_val=45)
        kriz_mevcut = kriz_mevcut * (1 - gercek_dusus / 100)
        if kriz_mevcut <= 18:
            rejim = 0
            sakin_yil = 0
            enf = normal(14, 3, min_val=8, max_val=20)
            durum = "normalleşme"
            kriz_mevcut = None
        else:
            enf = normal(kriz_mevcut, 6,
                        min_val=kriz_mevcut*0.85, max_val=kriz_mevcut*1.15)
            durum = "kriz devam"
    return enf, rejim, sakin_yil, kriz_mevcut, kriz_dusus_hizi, durum