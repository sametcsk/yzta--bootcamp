import random
from .utils import normal


def normal(ortalama, std, min_val=None, max_val=None):
    deger = random.gauss(ortalama, std)
    if min_val is not None:
        deger = max(deger, min_val)
    if max_val is not None:
        deger = min(deger, max_val)
    return round(deger, 4)


def doviz_sim(enflasyon, rejim):
    if rejim == 0:  # Sakin
        # Uzun vadede döviz = enflasyon olmalıdır.
        carpan = normal(1.0, 0.1, min_val=0.85, max_val=1.15)
    else:  # Kriz
        # Kriz anında kur şoku.
        carpan = normal(1.3, 0.3, min_val=1.0, max_val=2.0)
        
    doviz_degisim = enflasyon * carpan
    return round(doviz_degisim, 1), round(carpan, 2)