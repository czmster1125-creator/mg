import {captainLevel} from './captain.js';
export const SHIELD_STEPS=[{level:1,capacity:3},{level:5,capacity:4},{level:10,capacity:5},{level:20,capacity:6},{level:35,capacity:7},{level:50,capacity:8}];
export const shieldCapacity=s=>SHIELD_STEPS.filter(d=>captainLevel(s)>=d.level).at(-1)?.capacity||3;
export const nextShieldStep=s=>SHIELD_STEPS.find(d=>d.level>captainLevel(s));
