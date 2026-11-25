const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function read(file,delimiter){const buf=fs.readFileSync(file);let s=new TextDecoder('utf-8').decode(buf);if(s.includes('\uFFFD'))s=new TextDecoder('windows-1252').decode(buf);const rows=[];let row=[],v='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){v+='"';i++;}else if(q||!v)q=!q;else v+=c;}else if(!q&&(c===delimiter||c==='\r'||c==='\n')){row.push(v);v='';if(c!==delimiter){if(c==='\r'&&s[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];}}else v+=c;}if(v||row.length){row.push(v);rows.push(row);}const [h,...body]=rows;return {hash:crypto.createHash('sha256').update(buf).digest('hex'),rows:body.map(r=>Object.fromEntries(h.map((x,i)=>[x.trim(),(r[i]||'').trim()]))) };}
const norm=s=>String(s||'').toUpperCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^A-Z0-9]+/g,' ').trim();
const iso=s=>/^\d{8}$/.test(s)?s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8):null;
function sector(s){s=norm(s);if(/RESTAUR|COMIDA|CAFETER|PANADER|HOTEL|HOSPED/.test(s))return 'Alimentación y alojamiento';if(/VENTA|COMERCI|BODEGA|TIENDA|DISTRIBU|FARMAC|FERRETER/.test(s))return 'Comercio';if(/TRANSPOR|TALLER|MECANIC|AUTOMOT/.test(s))return 'Transporte y talleres';if(/FABRIC|PRODUC|INDUSTR|MANUFACT/.test(s))return 'Manufactura';if(/AGRIC|AGRO|GANADER/.test(s))return 'Agropecuario';return 'Servicios y otros';}
const m=read(process.argv[2],';'),j=read(process.argv[3],',');
const all=m.rows.filter(r=>r.UBIGEO==='220101'),valid=all.filter(r=>/^\d{11}$/.test(r.RUC_COMERCIAL)&&r.DIRECCION_COMERCIAL.length>4);
const groups=new Map();for(const r of valid){if(!groups.has(r.RUC_COMERCIAL))groups.set(r.RUC_COMERCIAL,[]);groups.get(r.RUC_COMERCIAL).push(r);}
const addr=a=>new Set(a.map(x=>norm(x.DIRECCION_COMERCIAL)));const d=r=>r.FECHA_EXPEDICION;
const realName=s=>s&&norm(s).length>2&&!/^(SIN NOMBRE|NO TIENE|NO REGISTRA|NINGUNO|S N|N A|NULL|NO APLICA)$/.test(norm(s));
function commercial(r,source){
 const name=source==='moy'?r.NOMBRE_COMERCIAL:r.NOMBRE_COMERCIAL;
 const corp=/^20\d{9}$/.test(source==='moy'?r.RUC_COMERCIAL:r.RUC);
 const publicVenue=source==='juan'&&realName(name)&&/^(HOTEL|HOSPEDAJE|HOSTAL|RESTAURANTE|RESTAURANT|CEVICHERIA|POLLERIA|CHIFA|CAFETERIA|ALOJAMIENTO|LODGE)\b/.test(norm(name))&&norm(name)!==norm(r.RAZON_SOCIAL);
 // Only legal entities' published commercial addresses; tourism storefront names can be searched by name, without personal address.
 return {nombre:(corp||publicVenue)&&realName(name)?name:null,direccion:corp&&realName(source==='moy'?r.DIRECCION_COMERCIAL:r.DIRECCION)?(source==='moy'?r.DIRECCION_COMERCIAL:r.DIRECCION):null};
}
const records=all.map((r,i)=>({id:'LIC-MOY-'+String(i+1).padStart(4,'0'),...commercial(r,'moy'),sector:sector(r.TIPO_ACTIVIDAD_COMERCIAL),fecha:iso(d(r)),anio:iso(d(r))?.slice(0,4)||null,tipo:'Licencia municipal',ubigeo:'220101'}));
const ids=new Map(all.map((r,i)=>[r,records[i].id]));
let multi=0;const candidates=[];
for(const group of groups.values()){if(addr(group).size<2)continue;multi++;
 const ordered=group.filter(r=>iso(d(r))).sort((a,b)=>d(a).localeCompare(d(b)));
 const before=ordered.filter(r=>d(r)<'20260101'),past=addr(before);if(!past.size)continue;
 const after=ordered.filter(r=>d(r)>='20260101'&&d(r)<='20261231'&&!past.has(norm(r.DIRECCION_COMERCIAL)));if(!after.length)continue;
 candidates.push({fecha_anterior:iso(d(before.at(-1))),fecha_nueva:iso(d(after[0])),fecha_ultima:iso(d(after.at(-1))),direcciones_anteriores:past.size,direcciones_nuevas:addr(after).size,sector:sector(after[0].TIPO_ACTIVIDAD_COMERCIAL),...commercial(after[0],'moy'),licencia_id:ids.get(after[0])});}
candidates.sort((a,b)=>b.fecha_nueva.localeCompare(a.fecha_nueva));candidates.forEach((x,i)=>x.id='EXP-MOY-'+String(i+1).padStart(3,'0'));
const jr=j.rows.filter(r=>r.UBIGEO==='220601').map((r,i)=>({id:'LIC-JUA-'+String(i+1).padStart(4,'0'),...commercial(r,'juan'),sector:'Alimentación y alojamiento',fecha:null,anio:/^\d{4}$/.test(r.ANIO_EMISION)?r.ANIO_EMISION:null,tipo:r.TIPO_ESTABLECIMIENTO,ubigeo:'220601'}));
const result={schema:'geogrowth-san-martin-v2',region:'San Martín',distritos:[
 {ubigeo:'220101',provincia:'Moyobamba',distrito:'Moyobamba',ref:{lat:-6.024149,lng:-76.984401},fuente:'Municipalidad Provincial de Moyobamba',url:'https://www.datosabiertos.gob.pe/dataset/lista-de-registros-de-licencia-de-funcionamiento-de-la-municipalidad-provincial-de-0',archivo_sha256:m.hash,inicio:'2022-01-06',corte:'2026-06-12',licencias:records.length,ruc_analizados:groups.size,ruc_multidireccion:multi,expansion_disponible:true,candidatos:candidates,registros:records},
 {ubigeo:'220601',provincia:'Mariscal Cáceres',distrito:'Juanjuí',ref:{lat:-7.255893,lng:-76.684864},fuente:'Municipalidad Provincial de Mariscal Cáceres',url:'https://www.datosabiertos.gob.pe/dataset/relaci%C3%B3n-de-restaurantes-y-hospedajes-con-licencia-de-funcionamiento-en-la-provincia-de',archivo_sha256:j.hash,inicio:'2019',corte:'2026 (directorio; año de emisión, sin fecha exacta)',licencias:jr.length,ruc_analizados:null,ruc_multidireccion:null,expansion_disponible:false,candidatos:[],registros:jr}],
 metodo:'Moyobamba: mismo RUC con dirección diferente en 2026 respecto al historial anterior. Es señal, no confirmación de expansión. Juanjuí: directorio sectorial con año de emisión y sin historial suficiente para confirmar expansión. Se omiten RUC, contactos y datos de titulares; las direcciones se publican solo para personas jurídicas, y los nombres comerciales de locales turísticos explícitamente identificados pueden buscarse por nombre. No se incluyen coordenadas individuales.'};
fs.writeFileSync(path.join(__dirname,'../data/licencias_san_martin.json'),JSON.stringify(result,null,2)+'\n');
console.log(result.distritos.map(x=>({distrito:x.distrito,licencias:x.licencias,candidatos:x.candidatos.length,localizables:x.registros.filter(r=>r.nombre||r.direccion).length,expansionLocalizable:x.candidatos.filter(r=>r.nombre||r.direccion).length})));
