const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const script = fs.readFileSync('public/webflow/checkout-pages.js','utf8');
  const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  const output = path.resolve('work/payment-audit-2026-09-10/browser');
  fs.mkdirSync(output,{recursive:true});
  let checks=0;
  try {
    for (const width of [390,1365]) for (const lang of ['hu','en','de','it','es','zh','ja','ar','pl','pt','fr']) {
      const context=await browser.newContext({viewport:{width,height:844}});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      let paid=false,requests=0;
      await page.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname.includes('/session/status/')) {
          requests++;
          return route.fulfill({json:{status:{paymentStatus:paid?'paid':'pending',financialStatus:'clear',overall:paid?'sent':'waiting_payment',
            lang,amountTotal:799,currency:'USD',packageCode:'standard_v1',reportEmailDeliveryStatus:paid?'delivered':'pending',
            stages:['payment','analysis','report','email','invoice','contract'].map(key=>({key,state:paid?'complete':'pending'}))}}});
        }
        if(url.hostname==='fixture.invalid')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body><script>'+script+'</script></body></html>'});
        return route.abort();
      });
      for(const kind of ['success','cancel']) {
        paid=false;
        const id=kind==='success'?'session_id=cs_test_browser':'sid=00000000-0000-4000-8000-000000000001';
        await page.goto(`https://fixture.invalid/${lang}-checkout-${kind}?${id}#nm_access=synthetic_browser_access_token_123456789`);
        await page.waitForFunction(()=>document.querySelectorAll('.nm-status-step').length===6);
        const pendingTitle=await page.locator('#nmCheckoutTitle').innerText();
        assert.equal(await page.locator('#nmVerifiedNextSteps').isVisible(),false);
        assert.equal(await page.locator('.nm-status-step[data-state="complete"]').count(),0);
        paid=true;await page.locator('#nmRefreshStatus').click();
        await page.waitForFunction(()=>document.querySelectorAll('.nm-status-step[data-state="complete"]').length===6);
        assert.notEqual(await page.locator('#nmCheckoutTitle').innerText(),pendingTitle);
        assert.equal(await page.locator('#nmVerifiedNextSteps').isVisible(),true);
        const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,dir:document.documentElement.dir}));
        assert.ok(dimensions.scroll<=dimensions.width+1,`${lang}/${kind}/${width} overflow ${JSON.stringify(dimensions)}`);
        assert.equal(dimensions.dir,lang==='ar'?'rtl':'ltr');
        assert.equal(errors.length,0,errors.join('\n'));
        if(['hu','ja','ar'].includes(lang))await page.screenshot({path:path.join(output,`${lang}-${kind}-${width}.png`),fullPage:true});
        checks++;
      }
      assert.ok(requests>=4);await context.close();
    }
    console.log(JSON.stringify({checks,languages:11,viewports:2,externalRequests:0,screenshots:output}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
