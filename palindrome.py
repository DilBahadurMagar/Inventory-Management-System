#ZERO SHOT PROMPTING
# def is_palindrome(n):
#     # Negative numbers are not palindromes (e.g., -121 != 121-)
#     if n < 0:
#         return False
    
#     original_num = n
#     reversed_num = 0
    
#     while n > 0:
#         digit = n % 10            # Get the last digit
#         reversed_num = (reversed_num * 10) + digit
#         n //= 10                  # Remove the last digit
        
#     return original_num == reversed_num

# # Testing
# print(is_palindrome(12121))   # True
# print(is_palindrome(123212)) # True
# print(is_palindrome(1001))    # False


# def is_palindrome(n):
#     # Convert number to string
#     s = str(n)
#     # Compare string with its reverse
#     return s == s[::-1]

# # Testing
# print(is_palindrome("ALA"))   # True
# print(is_palindrome(123))   # False



#FEW SHOT PROMPTING (THE COPY CAT)
import re

def is_palindrome(input_value):
    # 1. Normalize the input:
    # Convert to string to handle numbers, then to lowercase
    raw_string = str(input_value).lower()
    
    # Remove spaces and special characters using Regex (keeps only letters and numbers)
    normalized = re.sub(r'[^a-z0-9]', '', raw_string)
    
    # 2. Reverse the input
    reversed_version = normalized[::-1]
    
    # 3. Compare the reversed version with the original
    if normalized == reversed_version:
        # 4. Return specific output strings
        return "Palindrome"
    else:
        return "Not a palindrome"

# --- Test Cases ---
print(f"CAT: {is_palindrome('CAT')}")                          # Not a palindrome
print(f"ALA: {is_palindrome('ALA')}")                          # Palindrome
print(f"121: {is_palindrome(121)}")                            # Palindrome
print(f"Race Car: {is_palindrome('Race Car')}")                # Palindrome
print(f"Step on no pets!: {is_palindrome('Step on no pets!')}") # Palindrome
