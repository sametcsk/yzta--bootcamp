from .utils import normal

def mevduat_faizi_uret(enflasyon, rejim):
    if rejim == 0:
        carpan = normal(1.02, 0.05, min_val=0.90, max_val=1.15) # Sakin dönemde pozitif reel fırsatı
    else:
        carpan = normal(0.85, 0.10, min_val=0.60, max_val=1.0) # Krizde erir
    faiz = round(enflasyon * carpan, 1)
    return faiz, round(carpan, 2), round(faiz - enflasyon, 1)