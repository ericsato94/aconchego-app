import type { Story } from '../types'
import castle from '../assets/covers/castle.webp'
import lion from '../assets/covers/lion.webp'
import whale from '../assets/covers/whale.webp'
import fox from '../assets/covers/fox.webp'
import star from '../assets/covers/star.webp'
import panda from '../assets/covers/panda.webp'
import braveLion from '../assets/covers/brave-lion.webp'
import river from '../assets/covers/river.webp'
import { STORY_TEXTS } from './storyTexts'

/** Capas das histórias do catálogo. */
const COVERS: Record<string, Story['cover']> = {
  'o-leao-e-o-ratinho': { kind: 'image', src: lion, bg: '#bfe3f7' },
  'a-baleia-e-o-mar': { kind: 'image', src: whale, bg: '#9fd5f6' },
  'o-raposo-e-a-cegonha': { kind: 'image', src: fox, bg: '#d9e9b7' },
  'o-pequeno-principe': { kind: 'image', src: castle, bg: '#2d3f8a' },
  'a-estrelinha-perdida': { kind: 'image', src: star, bg: '#24387e', focus: 'center top' },
  'o-panda-e-o-sonho': { kind: 'image', src: panda, bg: '#2d4a9a', focus: 'center top' },
  'o-leao-corajoso': { kind: 'image', src: braveLion, bg: '#bfe3f7', focus: 'center top' },
  'a-cancao-do-rio': { kind: 'image', src: river, bg: '#9fd5f6', focus: 'center top' },
}

/** Catálogo completo (textos + capas). */
export const STORIES: Story[] = STORY_TEXTS.map((s) => ({ ...s, cover: COVERS[s.id] }))
