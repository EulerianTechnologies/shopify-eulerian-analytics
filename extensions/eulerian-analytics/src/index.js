import {register} from "@shopify/web-pixels-extension";

register(({ analytics, browser, init, settings }) => {

  // all events are captured and then filtered out
  analytics.subscribe("all_standard_events", event => {
    let ua = event.navigator?.userAgent ?? "";

    let EA_payload = [
      "euidl", event.clientId,
      "rf", event.context?.document?.referrer,
      "uid", init?.data?.customer?.id,
      "url", event.context?.document?.location?.href,
      "ereplay-ua", ua,
      "ereplay-ip", "none",
      "ereplay-time", new Date(event?.timestamp).getTime() / 1000,
      "ereplay-platform", "shopify"
    ];

    let send2eulerian = 0;

    // page_viewed
    if ( event.name === "page_viewed" ) {
      send2eulerian++;

    // product_viewed
    } else if ( event.name === "product_viewed" ) {
      const product = event.data.productVariant;

      EA_payload.push(
        "prdref", product.sku,
        "prdamount", product.price.amount,
        "prdname", product.title ?? ""
      );
      send2eulerian++;

    // checkout_completed
    } else if ( event.name === "checkout_completed" ) {
      const checkout = event.data.checkout;

      EA_payload.push(
        "ref", checkout.order?.id,
        "amount", checkout.totalPrice?.amount,
        "currency", checkout.currencyCode ?? "",
        "nc", checkout.order?.customer?.isFirstOrder ? 1 : 0
      );

      checkout.lineItems?.forEach( ( prd ) => {
        EA_payload.push(
          "prdref", prd.variant.sku,
          "prdname", prd.variant.title ?? "",
          "prdamount", prd.quantity,
          "prdprice", prd.finalLinePrice.amount
        );
      });

      send2eulerian++;

    } else {

    }

  // product_added_to_cart
  // product_removed_from_cart

    // send to Eulerian in server-side
    if ( send2eulerian ) {
      fetch(
        `https://${settings.targetDomain}.eulerian.net/collector/${settings.website}/`,
        {
          method: "POST",
          body: new URLSearchParams(EA_payload).toString(),
          keepalive: true
        }
      );
    }
  });

});
