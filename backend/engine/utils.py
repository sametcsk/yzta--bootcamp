import random

def normal(ortalama, std, min_val=None, max_val=None):
    deger = random.gauss(ortalama, std)
    if min_val is not None:
        deger = max(deger, min_val)
    if max_val is not None:
        deger = min(deger, max_val)
    return round(deger, 4)