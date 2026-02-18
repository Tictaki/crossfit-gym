from num2words import num2words

def amount_in_words(num):
    try:
        val = float(num)
        inteiro = int(val)
        centavos = int(round((val - inteiro) * 100))
        
        words = num2words(inteiro, lang='pt')
        result = f"{words} meticais"
        
        if centavos > 0:
            centavos_words = num2words(centavos, lang='pt')
            result += f" e {centavos_words} centavos"
            
        return result.lower()
    except Exception as e:
        return str(num)

# Test cases
tests = [3000, 1500.50, 1000000, 42.15]
for t in tests:
    print(f"{t} -> {amount_in_words(t)}")
