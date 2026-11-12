/** One pointer/key gesture emits either a tap or a hold, never both. */
export function bindHoldAction(button,{onTap,onHold,delay=600}){
 const controller=new AbortController(),signal=controller.signal;
 let press=null,timer=null,ignoreClickUntil=0;
 const now=()=>performance.now();
 function clear(){clearTimeout(timer);timer=null;button.classList.remove('holding');}
 function cancel(){clear();press=null;ignoreClickUntil=now()+350;}
 function begin(source,id,x=0,y=0){
  if(button.disabled||press)return;ignoreClickUntil=0;
  press={source,id,x,y,held:false,cancelled:false};button.classList.add('holding');
  timer=setTimeout(()=>{if(!press||press.cancelled||button.disabled||!button.isConnected){cancel();return;}press.held=true;onHold();},delay);
 }
 function finish(source,id){
  if(!press||press.source!==source||press.id!==id)return;
  const tap=!press.held&&!press.cancelled;clear();press=null;ignoreClickUntil=now()+350;
  if(source==='pointer')try{button.releasePointerCapture(id);}catch{}
  if(tap&&!button.disabled)onTap();
 }
 button.style.setProperty('--hold-duration',delay+'ms');
 button.addEventListener('pointerdown',e=>{
  if(e.isPrimary===false||e.button!==0||button.disabled||press)return;
  e.preventDefault();button.focus({preventScroll:true});begin('pointer',e.pointerId,e.clientX,e.clientY);
  try{button.setPointerCapture(e.pointerId);}catch{}
 },{signal});
 button.addEventListener('pointermove',e=>{
  if(press?.source!=='pointer'||press.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>14){press.cancelled=true;clear();}
 },{signal});
 button.addEventListener('pointerup',e=>{e.preventDefault();finish('pointer',e.pointerId);},{signal});
 button.addEventListener('pointercancel',cancel,{signal});
 button.addEventListener('lostpointercapture',()=>{if(press?.source==='pointer')cancel();},{signal});
 // Pointer activation is handled on release above. Suppress the browser's
 // synthesized click, while allowing standalone assistive/programmatic clicks.
 button.addEventListener('click',e=>{if(e.detail>0||now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}},{signal,capture:true});
 button.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
 button.addEventListener('keydown',e=>{
  if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();
  if(!e.repeat)begin('key',e.code);
 },{signal});
 button.addEventListener('keyup',e=>{
  if(!['Space','Enter'].includes(e.code))return;e.preventDefault();e.stopPropagation();finish('key',e.code);
 },{signal});
 button.addEventListener('blur',cancel,{signal});window.addEventListener('blur',cancel,{signal});window.addEventListener('pagehide',cancel,{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();},{signal});
 return ()=>{cancel();controller.abort();};
}
