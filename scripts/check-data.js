const { PrismaClient } = require('@prisma/client')

async function checkData() {
  const prisma = new PrismaClient()
  
  try {
    // Get all users with their related data
    const users = await prisma.user.findMany({
      include: {
        cart: true,
        cartItems: true,
        orders: true,
        addresses: true,
        reviews: true,
        wishlist: true
      }
    })
    
    console.log('Users data:')
    console.log(JSON.stringify(users, null, 2))

    // Get counts of different entities
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.cart.count(),
      prisma.cartItem.count(),
      prisma.order.count(),
      prisma.review.count()
    ])

    console.log('\nEntity counts:')
    console.log({
      users: counts[0],
      carts: counts[1],
      cartItems: counts[2],
      orders: counts[3],
      reviews: counts[4]
    })

  } catch (error) {
    console.error('Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData() 