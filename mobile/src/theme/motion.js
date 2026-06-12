import { Easing } from 'react-native-reanimated'

// Единый анимационный язык: всё в приложении двигается как дыхание —
// медленный вдох, мягкий выдох, никакой технологичной резкости.

// Пружина для откликов на касание и появления элементов: без звона, с весом
export const gentleSpring = { damping: 20, stiffness: 170, mass: 1 }

// Более тягучая пружина для крупных перемещений (оверлеи, hero)
export const softSpring = { damping: 26, stiffness: 120, mass: 1 }

// Цикл дыхания фона и «живых» элементов
export const breath = { duration: 4200, easing: Easing.inOut(Easing.sin) }

// Стандартное «оседание» контента
export const settle = { duration: 450, easing: Easing.bezier(0.32, 0.72, 0, 1) }

// Медленное проявление (ответ коуча, инсайты)
export const reveal = { duration: 800, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }
