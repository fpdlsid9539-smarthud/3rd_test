import ach1 from '../assets/icons/achievement/ach_1.png'
import ach2 from '../assets/icons/achievement/ach_2.png'
import ach3 from '../assets/icons/achievement/ach_3.png'
import ach4 from '../assets/icons/achievement/ach_4.png'
import ach5 from '../assets/icons/achievement/ach_5.png'
import ach6 from '../assets/icons/achievement/ach_6.png'
import ach7 from '../assets/icons/achievement/ach_7.png'
import ach8 from '../assets/icons/achievement/ach_8.png'
import ach9 from '../assets/icons/achievement/ach_9.png'
import ach10 from '../assets/icons/achievement/ach_10.png'
import ach11 from '../assets/icons/achievement/ach_11.png'
import ach12 from '../assets/icons/achievement/ach_12.png'
import ach13 from '../assets/icons/achievement/ach_13.png'
import ach14 from '../assets/icons/achievement/ach_14.png'
import ach15 from '../assets/icons/achievement/ach_15.png'
import ach16 from '../assets/icons/achievement/ach_16.png'
import ach17 from '../assets/icons/achievement/ach_17.png'
import ach18 from '../assets/icons/achievement/ach_18.png'
import ach19 from '../assets/icons/achievement/ach_19.png'
import ach20 from '../assets/icons/achievement/ach_20.png'
import ach21 from '../assets/icons/achievement/ach_21.png'
import ach22 from '../assets/icons/achievement/ach_22.png'
import ach23 from '../assets/icons/achievement/ach_23.png'
import ach24 from '../assets/icons/achievement/ach_24.png'
import ach25 from '../assets/icons/achievement/ach_25.png'
import ach26 from '../assets/icons/achievement/ach_26.png'
import ach27 from '../assets/icons/achievement/ach_27.png'
import ach28 from '../assets/icons/achievement/ach_28.png'
import ach29 from '../assets/icons/achievement/ach_29.png'
import ach30 from '../assets/icons/achievement/ach_30.png'

const achievementIconMap = {
  1: ach1,
  2: ach2,
  3: ach3,
  4: ach4,
  5: ach5,
  6: ach6,
  7: ach7,
  8: ach8,
  9: ach9,
  10: ach10,
  11: ach11,
  12: ach12,
  13: ach13,
  14: ach14,
  15: ach15,
  16: ach16,
  17: ach17,
  18: ach18,
  19: ach19,
  20: ach20,
  21: ach21,
  22: ach22,
  23: ach23,
  24: ach24,
  25: ach25,
  26: ach26,
  27: ach27,
  28: ach28,
  29: ach29,
  30: ach30,
}

export const getAchievementIcon = (achId) => {
  return achievementIconMap[Number(achId)] || ach1
}