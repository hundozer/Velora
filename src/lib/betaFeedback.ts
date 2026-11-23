// Carolinka's 23 November 2026 beta questionnaire. Questions 1–14 are anonymous.
// Question 15 is a separate voluntary contact form, not linked to a response.
export type FeedbackKind = "text" | "scale" | "choice";
export type BetaQuestion = {
 id:number; en:string; cs:string; kind:FeedbackKind;
 choices?: {value:string;en:string;cs:string}[];
 helpEn?:string; helpCs?:string; extra?:boolean;
};
export const BETA_FEEDBACK_OPEN_AT = "2026-12-15T00:00:00.000Z";
export const BETA_FEEDBACK_CLOSE_AT = "2027-01-01T00:00:00.000Z";
export const betaFeedbackQuestions: BetaQuestion[] = [
 {id:1,en:"In three words, how did Intimo feel?",cs:"Jak na tebe Intimo působilo? Tři slova.",kind:"text"},
 {id:2,en:"Was it what you expected? What was different?",cs:"Odpovídalo to tvému očekávání? Co bylo jinak?",kind:"text"},
 {id:3,en:"How did the age check feel?",cs:"Jak na tebe působilo ověření věku?",kind:"scale",helpEn:"1 = awkward, 5 = respectful",helpCs:"1 = nepříjemné, 5 = respektující"},
 {id:4,en:"Was anything confusing while joining?",cs:"Bylo při registraci něco nejasného?",kind:"text"},
 {id:5,en:"How much in control do you feel of who sees what on your profile?",cs:"Nakolik máš pod kontrolou, kdo co na tvém profilu uvidí?",kind:"scale",helpEn:"1 = no control, 5 = full control",helpCs:"1 = vůbec, 5 = úplně"},
 {id:6,en:"Was the consent step clear?",cs:"Byl krok se souhlasem srozumitelný?",kind:"choice",extra:true,choices:[{value:"yes",en:"Yes",cs:"Ano"},{value:"not_quite",en:"Not quite",cs:"Ne úplně"},{value:"no",en:"No",cs:"Ne"}]},
 {id:7,en:"Did you get to a first message or a plan in Tonight? If not, what held you back?",cs:"Došlo na první zprávu nebo plán v Dnes večer? Pokud ne, co tě zdrželo?",kind:"text"},
 {id:8,en:"How safe did Intimo feel? Did anything make you uneasy?",cs:"Jak bezpečně na tebe Intimo působilo? Znejistilo tě něco?",kind:"scale",extra:true,helpEn:"1 = not safe, 5 = very safe",helpCs:"1 = vůbec bezpečně, 5 = velmi bezpečně"},
 {id:9,en:"How does Intimo come across: too tame, just right, or too much?",cs:"Jak Intimo působí: příliš krotce, akorát, nebo už moc?",kind:"choice",extra:true,choices:[{value:"too_tame",en:"Too tame",cs:"Příliš krotce"},{value:"just_right",en:"Just right",cs:"Akorát"},{value:"too_much",en:"Too much",cs:"Už moc"}]},
 {id:10,en:"Which words or screens felt off, or not like Intimo?",cs:"Která slova nebo obrazovky ti nesedly nebo nepůsobily jako Intimo?",kind:"text"},
 {id:11,en:"One thing we should add or change before we open the doors?",cs:"Jedna věc, kterou bychom měli přidat nebo změnit, než otevřeme dveře?",kind:"text"},
 {id:12,en:"How likely are you to send an invitation to a friend?",cs:"Jak pravděpodobné je, že pošleš pozvánku kamarádovi nebo kamarádce?",kind:"scale",helpEn:"0 = not at all, 10 = very likely",helpCs:"0 = vůbec, 10 = velmi pravděpodobné"},
 {id:13,en:"What kind of person should be here who isn't yet? No names.",cs:"Jaký typ lidí by tu měl být a zatím chybí? Bez jmen.",kind:"text"},
 {id:14,en:"Did anything break? What happened just before, and on which device?",cs:"Rozbilo se něco? Co se dělo těsně předtím a na jakém zařízení?",kind:"text"},
];
export function validateBetaFeedback(input:unknown): Record<string,string|number|null>|null {
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const obj=input as Record<string,unknown>;
 if(Object.keys(obj).some(key=>!/^q(?:[1-9]|1[0-4])(?:_extra)?$/.test(key)))return null;
 const result:Record<string,string|number|null>={};
 for(const q of betaFeedbackQuestions){
   const key="q"+q.id; const v=obj[key];
   if(v===undefined||v===null||v===""){result[key]=null;}
   else if(q.kind==="text" && typeof v==="string" && v.trim().length<=1000)result[key]=v.trim();
   else if(q.kind==="scale" && Number.isInteger(v) && typeof v==="number" && v>=(q.id===12?0:1) && v<=(q.id===12?10:5))result[key]=v;
   else if(q.kind==="choice" && typeof v==="string" && q.choices?.some(x=>x.value===v))result[key]=v;
   else return null;
   if(q.extra){
     const e=obj[key+"_extra"];
     if(e===undefined||e===null||e==="")result[key+"_extra"]=null;
     else if(typeof e==="string"&&e.trim().length<=1000)result[key+"_extra"]=e.trim();
     else return null;
   }
 }
 return result;
}
