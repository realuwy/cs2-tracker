"use client";

const RAW_CODE = String.raw`(async()=>{
  const A=alert;
  try{
    const u=new URL(location.href);
    if(!/steamcommunity\.com/.test(u.host))return A('Open your Steam profile first (steamcommunity.com).');
    let id='';
    const m=u.pathname.match(/\/profiles\/(\d{17})/i);
    if(m)id=m[1];
    const m2=u.pathname.match(/\/id\/([^\/?#]+)/i);
    if(!id&&m2){
      try{
        const r=await fetch('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?vanityurl='+encodeURIComponent(m2[1])+'&url_type=1');
        const j=await r.json();
        if(j?.response?.success===1)id=j.response.steamid;
      }catch{}
    }
    if(!id&&(window as any).g_rgProfileData?.steamid)id=String((window as any).g_rgProfileData.steamid);
    if(!/^(?:\d){17}$/.test(id))return A('Could not find SteamID64 on this page. Open your profile or inventory page.');

    const h={'accept':'application/json, text/plain, */*','user-agent':navigator.userAgent,'referer':'https://steamcommunity.com/'};
    const hit=async url=>{
      try{
        const r=await fetch(url,{headers:h,redirect:'follow',cache:'no-store'});
        const t=await r.text();
        try{return {ok:r.ok,json:JSON.parse(t)}}catch{return {ok:r.ok,text:t}}
      }catch(e){return {ok:false,err:String(e)}}
    };

    const mapNew=(data)=>{
      const d=new Map((data.descriptions||[]).map(x=>[\`${'${'}x.classid${'}'}_\${${'x.instanceid||'+"'0'"+'}'}\`,x]));
      return (data.assets||[]).map(a=>{
        const x=d.get(\`${'${'}a.classid${'}'}_\${${'a.instanceid||'+"'0'"+'}'}\`)||{};
        const nm=x.market_hash_name||x.market_name||x.name||'Unknown';
        const ic=x.icon_url_large||x.icon_url||'';
        const wear=(nm.match(/\((?:FN|MW|FT|WW|BS|Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i)||[])[1]||'';
        return{
          id:\`${'${'}a.classid${'}'}_\${${'a.instanceid||'+"'0'"+'}'}_\${${'a.assetid'}\}\`,
          assetid:String(a.assetid),
          classid:String(a.classid),
          name:nm,
          exterior:wear,
          icon:ic?('https://steamcommunity-a.akamaihd.net/economy/image/'+ic):''
        };
      });
    };

    const mapLegacy=(raw)=>{
      const inv=raw.rgInventory||{};
      const desc=raw.rgDescriptions||{};
      return Object.values(inv).map((v)=>{
        const d=desc[\`${'${'}v.classid${'}'}_\${${'v.instanceid||'+"'0'"+'}'}\`]||{};
        const nm=d.market_hash_name||d.market_name||d.name||'Unknown';
        const ic=d.icon_url_large||d.icon_url||'';
        const wear=(nm.match(/\((?:FN|MW|FT|WW|BS|Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i)||[])[1]||'';
        return{
          id:\`${'${'}v.classid${'}'}_\${${'v.instanceid||'+"'0'"+'}'}_\${${'v.id'}\}\`,
          assetid:String(v.id),
          classid:String(v.classid),
          name:nm,
          exterior:wear,
          icon:ic?('https://steamcommunity-a.akamaihd.net/economy/image/'+ic):''
        };
      });
    };

    let out=null;
    let r=await hit('https://steamcommunity.com/inventory/'+id+'/730/2?l=english&count=5000&norender=1');
    if(r.ok&&r.json?.assets)out={count:r.json.assets.length,items:mapNew(r.json)};
    if(!out){
      r=await hit('https://steamcommunity.com/profiles/'+id+'/inventory/json/730/2?l=english');
      if(r.ok&&r.json?.success)out={count:Object.keys(r.json.rgInventory||{}).length,items:mapLegacy(r.json)};
    }
    if(!out)return A('Could not fetch inventory here. Make sure you are on your own profile and the inventory is Public.');

    const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='cs2-inventory-'+id+'.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }catch(e){
    alert('Importer error: '+(e?.message||e));
  }
})();`;

// Escape every `${` so TS doesn’t interpolate it:
const SAFE_CODE = RAW_CODE.replace(/\$\{/g, "\\${");
const BOOKMARKLET = "javascript:" + SAFE_CODE;

export default function SteamBookmarklet() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-lg font-semibold text-text">Bookmarklet</h3>
      <p className="mb-3 text-sm text-muted">
        Drag this to your bookmarks bar. Open your Steam profile (while logged in), then click it to download your inventory JSON.
      </p>
      <a
        href={BOOKMARKLET}
        className="inline-block rounded-lg bg-accent px-4 py-2 font-medium text-black shadow-neon focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        CS2 Inventory Export
      </a>
    </div>
  );
}

