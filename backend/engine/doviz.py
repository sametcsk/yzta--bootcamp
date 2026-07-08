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
    if rejim == 0:
        carpan = normal(2.0, 0.6, min_val=0.8, max_val=4.0)
    else:
        carpan = normal(1.5, 0.8, min_val=0.5, max_val=5.0)
    return round(enflasyon * carpan, 1), round(carpan, 2)