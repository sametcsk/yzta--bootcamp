from .utils import normal

def mevduat_faizi_uret(enflasyon, rejim):
    if rejim == 0:
        carpan = normal(0.95, 0.12, min_val=0.70, max_val=1.20)
    else:
        carpan = normal(0.65, 0.15, min_val=0.40, max_val=0.90)
    faiz = round(enflasyon * carpan, 1)
    return faiz, round(carpan, 2), round(faiz - enflasyon, 1)