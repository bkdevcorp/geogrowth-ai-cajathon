const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const buf=fs.readFileSync(process.argv[2]);let txt=new TextDecoder('utf-8').decode(buf);
if(txt.includes('\uFFFD'))txt=new TextDecoder('windows-1252').decode(buf);
function parse(s){const rows=[];let row=[],v='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){v+='"';i++;}else if(quoted||!v)quoted=!quoted;else v+=c;}else if(!quoted&&(c===';'||c==='\r'||c==='\n')){row.push(v);v='';if(c!==';'){if(c==='\r'&&s[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];}}else v+=c;}if(v||row.length){row.push(v);rows.push(row);}return rows;}
const [head,...body]=parse(txt);const rows=body.map(row=>Object.fromEntries(head.map((h,i)=>[h.trim(),row[i]||''])));
const all=rows.filter(r=>r.UBIGEO.trim()==='220101');
const valid=all.filter(r=>/^\d{11}$/.test(r.RUC_COMERCIAL)&&r.DIRECCION_COMERCIAL.trim().length>4);
const norm=s=>String(s||'').toUpperCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^A-Z0-9]+/g,' ').trim();
const iso=s=>s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);
function sector(s){s=norm(s);if(/RESTAUR|COMIDA|CAFETER|PANADER|HOTEL|HOSPED/.test(s))return 'Alimentación y alojamiento';if(/VENTA|COMERCI|BODEGA|TIENDA|DISTRIBU|FARMAC/.test(s))return 'Comercio';if(/TRANSPOR|TALLER|MECANIC|AUTOMOT/.test(s))return 'Transporte y talleres';if(/FABRIC|PRODUC|INDUSTR|MANUFACT/.test(s))return 'Manufactura';if(/AGRIC|AGRO|GANADER/.test(s))return 'Agropecuario';return 'Servicios y otros';}
const groups=new Map();for(const r of valid){if(!groups.has(r.RUC_COMERCIAL))groups.set(r.RUC_COMERCIAL,[]);groups.get(r.RUC_COMERCIAL).push(r);}
const addr=a=>new Set(a.map(x=>norm(x.DIRECCION_COMERCIAL)));const d=r=>r.FECHA_EXPEDICION;let multi=0;const candidates=[];
for(const group of groups.values()){
 if(addr(group).size<2)continue;multi++;
 const ordered=group.filter(r=>/^\d{8}$/.test(d(r))).sort((a,b)=>d(a).localeCompare(d(b)));
 const before=ordered.filter(r=>d(r)<'20260101'),past=addr(before);if(!past.size)continue;
 const after=ordered.filter(r=>d(r)>='20260101'&&d(r)<='20261231'&&!past.has(norm(r.DIRECCION_COMERCIAL)));if(!after.length)continue;
 candidates.push({fecha_anterior:iso(d(before.at(-1))),fecha_nueva:iso(d(after[0])),fecha_ultima:iso(d(after.at(-1))),direcciones_anteriores:past.size,direcciones_nuevas:addr(after).size,sector:sector(after[0].TIPO_ACTIVIDAD_COMERCIAL)});
}
const dates=all.map(d).filter(s=>/^\d{8}$/.test(s)).sort();
const result={schema:'geogrowth-expansion-v1',region:'San Martín',provincia:'Moyobamba',distrito:'Moyobamba',ubigeo:'220101',fuente:'Municipalidad Provincial de Moyobamba / Plataforma Nacional de Datos Abiertos',url:'https://www.datosabiertos.gob.pe/dataset/lista-de-registros-de-licencia-de-funcionamiento-de-la-municipalidad-provincial-de-0',archivo_sha256:crypto.createHash('sha256').update(buf).digest('hex'),corte:iso(dates.at(-1)),inicio:iso(dates[0]),licencias:all.length,ruc_analizados:groups.size,ruc_multidireccion:multi,candidatos:candidates.sort((a,b)=>b.fecha_nueva.localeCompare(a.fecha_nueva)).map((x,i)=>({id:'EXP-MOY-'+String(i+1).padStart(3,'0'),...x})),metodo:'RUC de 11 dígitos; dirección normalizada; una o más direcciones nuevas en 2026 frente a las observadas antes de 2026. No confirma sucursal, apertura ni vigencia. Sin RUC, nombres, direcciones ni coordenadas individuales publicados.'};
fs.writeFileSync(path.join(__dirname,'../data/expansion_moyobamba.json'),JSON.stringify(result,null,2)+'\n');
console.log({licencias:result.licencias,ruc:result.ruc_analizados,multi,candidatos:candidates.length,corte:result.corte});
