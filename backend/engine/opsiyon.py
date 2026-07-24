import math

def norm_cdf(x):
    """Standart normal kümülatif dağılım fonksiyonu."""
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    S: Güncel Fiyat (Spot Price)
    K: Kullanım Fiyatı (Strike Price)
    T: Vade (Yıl cinsinden, örn: 1.0)
    r: Risksiz Faiz Oranı (Örn: 0.30)
    sigma: Volatilite (Örn: 0.20)
    option_type: "call" veya "put"
    """
    if T <= 0:
        if option_type == "call":
            return max(0.0, S - K)
        else:
            return max(0.0, K - S)
            
    if S <= 0.0 or K <= 0.0:
        return 0.0
            
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    
    if option_type == "call":
        price = S * norm_cdf(d1) - K * math.exp(-r * T) * norm_cdf(d2)
    elif option_type == "put":
        price = K * math.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)
    else:
        raise ValueError("option_type 'call' veya 'put' olmalıdır.")
        
    return round(price, 2)

def generate_option_chain(S, r, sigma):
    """
    Güncel fiyata göre 3 kademe (ITM, ATM, OTM) strike fiyatı üretir 
    ve bunların 1 yıllık (1.0) ve 2 yıllık (2.0) primlerini döndürür.
    """
    strikes = [
        round(S * 0.90, 2),  # Call için ITM, Put için OTM
        round(S * 1.0, 2),   # ATM
        round(S * 1.10, 2)   # Call için OTM, Put için ITM
    ]
    
    chain = []
    for K in strikes:
        call_1y = black_scholes(S, K, 1.0, r, sigma, "call")
        put_1y = black_scholes(S, K, 1.0, r, sigma, "put")
        call_2y = black_scholes(S, K, 2.0, r, sigma, "call")
        put_2y = black_scholes(S, K, 2.0, r, sigma, "put")
        
        chain.append({
            "strike": K,
            "call_premium_1y": call_1y,
            "put_premium_1y": put_1y,
            "call_premium_2y": call_2y,
            "put_premium_2y": put_2y
        })
        
    return chain
