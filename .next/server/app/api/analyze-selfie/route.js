"use strict";(()=>{var e={};e.id=690,e.ids=[690],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6844:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>x,patchFetch:()=>v,requestAsyncStorage:()=>h,routeModule:()=>g,serverHooks:()=>y,staticGenerationAsyncStorage:()=>m});var n={};t.r(n),t.d(n,{POST:()=>f,runtime:()=>p});var r=t(9303),s=t(8716),i=t(670),o=t(7070),l=t(1258);let u=[{name:"Textured Bob",reason:"Adds movement and volume while softly framing most face shapes."},{name:"Curtain Layers",reason:"Long, face-framing layers that balance wide cheeks and soften sharp jawlines."},{name:"Modern Shag",reason:"Works well for wavy or straight hair, adding lift at the crown and definition around the eyes."}],c={faceShape:"oval",hairTexture:"unknown",skinTone:"unknown"};async function d(e,a){let t=function(){let e="AIzaSyCqsaGaq-sR07vxa5UGQdc3CUNXnCfF1fQ";return e?new l.$D(e):(console.warn("GEMINI_API_KEY is not set. Falling back to mock hairstyle suggestions."),null)}();if(!t)return{faceProfile:c,suggestions:u};let n=t.getGenerativeModel({model:"gemini-pro-vision"}),r=`
You are a world-class hairstylist and face-shape analyst.

Look closely at this selfie and:
1) Infer the person's face shape, hair texture, and skin tone category.
2) Recommend 3 specific hairstyles that would be very flattering.

Respond with STRICT JSON that matches this TypeScript type:

type Response = {
  faceProfile: {
    faceShape:
      | "round"
      | "oval"
      | "square"
      | "heart"
      | "diamond"
      | "oblong";
    hairTexture: string; // e.g. "straight", "wavy", "coily"
    skinTone: string; // e.g. "cool fair", "warm medium", "deep neutral"
  };
  suggestions: {
    name: string;   // concise hairstyle name
    reason: string; // 1–2 sentence explanation tailored to this face
  }[];
};

Return ONLY valid JSON. Do not include markdown, backticks, or any extra text.
`.trim(),s={inlineData:{data:e.toString("base64"),mimeType:a}},i=null;try{let e=(await n.generateContent([{text:r},s])).response.text();try{i=JSON.parse(e)}catch(a){console.error("Failed to parse Gemini JSON response:",a,e)}}catch(e){console.error("Error calling Gemini for selfie analysis:",e)}return i&&i.suggestions&&Array.isArray(i.suggestions)&&0!==i.suggestions.length?i:{faceProfile:c,suggestions:u}}let p="nodejs";async function f(e){try{if((e.headers.get("content-type")||"").includes("multipart/form-data")){let a=(await e.formData()).get("file");if(!a||!(a instanceof File))return o.NextResponse.json({error:"No image file found in request."},{status:400});let t=await a.arrayBuffer(),n=Buffer.from(t),r=a.type||"image/jpeg",{suggestions:s}=await d(n,r);return o.NextResponse.json({suggestions:s,selfie:{data:n.toString("base64"),mimeType:r}})}return o.NextResponse.json({error:"Image file is required."},{status:400})}catch(e){return console.error("Error in /api/analyze-selfie:",e),o.NextResponse.json({error:"Failed to analyze selfie.",suggestions:[]},{status:500})}}let g=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analyze-selfie/route",pathname:"/api/analyze-selfie",filename:"route",bundlePath:"app/api/analyze-selfie/route"},resolvedPagePath:"/Users/niranjanvijay/Development/Gemini Hackathon/gemini-hackathon/src/app/api/analyze-selfie/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:y}=g,x="/api/analyze-selfie/route";function v(){return(0,i.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:m})}}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[948,434],()=>t(6844));module.exports=n})();