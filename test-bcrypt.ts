import bcrypt from 'bcryptjs'

const password = 'admin123'
const hash = await bcrypt.hash(password, 10)
console.log('Hash:', hash)

const valid = await bcrypt.compare(password, hash)
console.log('Valid:', valid)
