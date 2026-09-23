// Supplied first-person burst: +8 dB mastering drive, peak controlled to
// -0.8 dBFS, plus a stronger effects-bus level through the game's master limiter.
// One burst starts with the live volley, never one overlapping copy per tile.
export const WIN_SHOT_DURATION=1;
export const WIN_SHOT_GAIN=1.6;
export const WIN_SHOT_FILES={
 burst:['first-person-loud.wav']
};

export function winShotEvents(sequence){
 const first=sequence.shots?.[0];
 return first?[{kind:'burst',take:0,at:first.fire,pan:0,gain:WIN_SHOT_GAIN}]:[];
}
