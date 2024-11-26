//set up canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

//let sb sticks to the ground
const gravity = 0.7

//ust background
const background = new Sprite({
  position: {
    x: 0,
    y: 0
  },
  imageSrc: './img/background.jpg'
})

//create sb
const player1 = new Fighter({
  position: {
    x: 0,
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: {
    x: 0,
    y: 0
  },
  imageSrc: './img/man/Idle.png',
  framesMax: 10,
  scale: 3,
  offset: {
    x: 0,
    y: 125
  },
  sprites: {
    idle: {
      imageSrc: './img/man/Idle.png',
      framesMax: 10
    },
    run: {
      imageSrc: './img/man/Run.png',
      framesMax: 8
    },
    jump: {
      imageSrc: './img/man/Jump.png',
      framesMax: 3
    },
    fall: {
      imageSrc: './img/man/Fall.png',
      framesMax: 3
    },
    attack1: {
      imageSrc: './img/man/Attack1.png',
      framesMax: 7
    },
    takeHit: {
      imageSrc: './img/man/TakeHit.png',
      framesMax: 3
    },
    death: {
      imageSrc: './img/man/Death.png',
      framesMax: 11
    }
  },
  attackBox: {
    offset: {
      x: 130,
      y: 50
    },
    width: 160,
    height: 50
  }
})

const player2 = new Fighter({
  position: {
    x: 700,
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  },
  color: 'blue',
  offset: {
    x: -50,
    y: 0
  },
  imageSrc: './img/woman/Idle.png',
  framesMax: 8,
  scale: 3.2,
  offset: {
    x: 120,
    y: 189
  },
  sprites: {
    idle: {
      imageSrc: './img/woman/Idle.png',
      framesMax: 8
    },
    run: {
      imageSrc: './img/woman/Run.png',
      framesMax: 8
    },
    jump: {
      imageSrc: './img/woman/Jump.png',
      framesMax: 2
    },
    fall: {
      imageSrc: './img/woman/Fall.png',
      framesMax: 2
    },
    attack1: {
      imageSrc: './img/woman/Attack1.png',
      framesMax: 5
    },
    takeHit: {
      imageSrc: './img/woman/Take hit.png',
      framesMax: 3
    },
    death: {
      imageSrc: './img/woman/Death.png',
      framesMax: 8
    }
  },
  attackBox: {
    offset: {
      x: -220,
      y: 100
    },
    width: 170,
    height: 50
  }
})

console.log(player1)

const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  ArrowRight: {
    pressed: false
  },
  ArrowLeft: {
    pressed: false
  }
}

decreaseTimer()

function animate() {
  window.requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  background.update()
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player1.update()
  player2.update()

  player1.velocity.x = 0
  player2.velocity.x = 0

  // player1 movement

  if (keys.a.pressed && player1.lastKey === 'a') {
    player1.velocity.x = -5
    player1.switchSprite('run')
  } else if (keys.d.pressed && player1.lastKey === 'd') {
    player1.velocity.x = 5
    player1.switchSprite('run')
  } else {
    player1.switchSprite('idle')
  }

  // jumping
  if (player1.velocity.y < 0) {
    player1.switchSprite('jump')
  } else if (player1.velocity.y > 0) {
    player1.switchSprite('fall')
  }

  // player2 movement
  if (keys.ArrowLeft.pressed && player2.lastKey === 'ArrowLeft') {
    player2.velocity.x = -5
    player2.switchSprite('run')
  } else if (keys.ArrowRight.pressed && player2.lastKey === 'ArrowRight') {
    player2.velocity.x = 5
    player2.switchSprite('run')
  } else {
    player2.switchSprite('idle')
  }

  // jumping
  if (player2.velocity.y < 0) {
    player2.switchSprite('jump')
  } else if (player2.velocity.y > 0) {
    player2.switchSprite('fall')
  }

  // detect for collision & player2 gets hit
  if (
    rectangularCollision({
      rectangle1: player1,
      rectangle2: player2
    }) &&
    player1.isAttacking &&
    player1.framesCurrent === 4
  ) {
    player2.takeHit()
    player1.isAttacking = false

    gsap.to('#player2Health', {
      width: player2.health + '%'
    })
  }

  // if player1 misses
  if (player1.isAttacking && player1.framesCurrent === 4) {
    player1.isAttacking = false
  }

  // this is where our player1 gets hit
  if (
    rectangularCollision({
      rectangle1: player2,
      rectangle2: player1
    }) &&
    player2.isAttacking &&
    player2.framesCurrent === 2
  ) {
    player1.takeHit()
    player2.isAttacking = false

    gsap.to('#player1Health', {
      width: player1.health + '%'
    })
  }

  // if player1 misses
  if (player2.isAttacking && player2.framesCurrent === 2) {
    player2.isAttacking = false
  }

  // end game based on health
  if (player2.health <= 0 || player1.health <= 0) {
    determineWinner({ player1, player2, timerId })
  }
}

animate()

window.addEventListener('keydown', (event) => {
  if (!player1.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player1.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player1.lastKey = 'a'
        break
      case 'w':
        player1.velocity.y = -20
        break
      case ' ':
        player1.attack()
        break
      case 't':
        player1.cheat = true
        break
    }
  }

  if (!player2.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        player2.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        player2.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        player2.velocity.y = -20
        break
      case 'ArrowDown':
        player2.attack()
        break
      case 'p':
        player2.cheat = true
        break
    }
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 't':
      player1.cheat = false
      break
  }

  // player2 keys
  switch (event.key) {
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
    case 'p':
      player2.cheat = false
      break
  }
})