/**
 * Generate a cryptographically strong password that meets all requirements
 * - 12-16 characters (randomized length)
 * - At least 2 uppercase letters
 * - At least 2 lowercase letters
 * - At least 2 digits
 * - At least 2 special characters
 */
export function generateStrongPassword(): string {
  const length = 12 + Math.floor(Math.random() * 5); // 12-16 chars
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|';
  
  // Helper function to get random characters from a set
  const getRandomChars = (charset: string, count: number): string => {
    let result = '';
    const array = new Uint32Array(count);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < count; i++) {
      result += charset[array[i] % charset.length];
    }
    return result;
  };
  
  // Ensure minimum requirements (2 of each type)
  let password = '';
  password += getRandomChars(uppercase, 2);
  password += getRandomChars(lowercase, 2);
  password += getRandomChars(numbers, 2);
  password += getRandomChars(specialChars, 2);
  
  // Fill remaining length with random chars from all sets
  const allChars = uppercase + lowercase + numbers + specialChars;
  const remainingLength = length - 8;
  password += getRandomChars(allChars, remainingLength);
  
  // Shuffle using Fisher-Yates algorithm
  const chars = password.split('');
  const array = new Uint32Array(chars.length);
  crypto.getRandomValues(array);
  
  for (let i = chars.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
}
