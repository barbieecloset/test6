# @shopify/hydrogen

## 2023.1.7

### Patch Changes

- Adopt Remix [`v2_meta`](https://remix.run/docs/en/main/route/meta#metav2) future flag ([#738](https://github.com/Shopify/hydrogen/pull/738)) by [@wizardlyhel](https://github.com/wizardlyhel)

  ### `v2_meta` migration steps

  1. For any routes that you used `meta` route export, convert it to the `V2_MetaFunction` equivalent. Notice that the package name in the import statement has also changed to `'@remix-run/react'`:

     ```diff
     - import {type MetaFunction} from '@shopify/remix-oxygen';
     + import {type V2_MetaFunction} from '@remix-run/react';

     - export const meta: MetaFunction = () => {
     + export const meta: V2_MetaFunction = () => {
     -   return {title: 'Login'};
     +   return [{title: 'Login'}];
       };
     ```

  2. If you are using data from loaders, pass the loader type to the `V2_MetaFunction` generic:

     ```diff
     - export const meta: MetaFunction = ({data}) => {
     + export const meta: V2_MetaFunction<typeof loader> = ({data}) => {
     -   return {title: `Order ${data?.order?.name}`};
     +   return [{title: `Order ${data?.order?.name}`}];
       };
     ```

  3. If you are using `meta` route export in `root`, convert it to [Global Meta](https://remix.run/docs/en/main/route/meta#global-meta)

     ```diff
     // app/root.tsx

     - export const meta: MetaFunction = () => ({
     -   charset: 'utf-8',
     -   viewport: 'width=device-width,initial-scale=1',
     - });

     export default function App() {

       return (
         <html lang={locale.language}>
           <head>
     +       <meta charSet="utf-8" />
     +       <meta name="viewport" content="width=device-width,initial-scale=1" />
             <Seo />
             <Meta />
     ```

- Adopt Remix [`unstable_tailwind`](https://remix.run/docs/en/1.15.0/guides/styling#built-in-tailwind-support) and [`unstable_postcss`](https://remix.run/docs/en/1.15.0/guides/styling#built-in-postcss-support) future flags for the Demo Store template. ([#751](https://github.com/Shopify/hydrogen/pull/751)) by [@frandiox](https://github.com/frandiox)

  ### `unstable_tailwind` and `unstable_postcss` migration steps

  1. Move the file `<root>/styles/app.css` to `<root>/app/styles/app.css`, and remove it from `.gitignore`.

  2. Add `"browserslist": ["defaults"]` to your `package.json`, or your preferred [value from Browserslist](https://browsersl.ist/).

  3. Replace the `build` and `dev` scripts in your `package.json` with the following:

     **Before**

     ```json
      "scripts": {
        "build": "npm run build:css && shopify hydrogen build",
        "build:css": "postcss styles --base styles --dir app/styles --env production",
        "dev": "npm run build:css && concurrently -g --kill-others-on-fail -r npm:dev:css \"shopify hydrogen dev\"",
        "dev:css": "postcss styles --base styles --dir app/styles -w",
        ...
      }
     ```

     **After**

     ```json
      "scripts": {
        "dev": "shopify hydrogen dev",
        "build": "shopify hydrogen build",
        ...
      }
     ```

  You can also remove dependencies like `concurrently` if you don't use them anywhere else.

- Carts created in liquid will soon be compatible with the Storefront API and vice versa, making it possible to share carts between channels. ([#721](https://github.com/Shopify/hydrogen/pull/721)) by [@scottdixon](https://github.com/scottdixon)

  This change updates the Demo Store to use Online Store's `cart` cookie (instead of sessions) which prevents customers from losing carts when merchants migrate to/from Hydrogen.

- Bump internal Remix dependencies to 1.15.0. ([#728](https://github.com/Shopify/hydrogen/pull/728)) by [@wizardlyhel](https://github.com/wizardlyhel)

  Recommendations to follow:

  - Upgrade all the Remix packages in your app to 1.15.0.
  - Enable Remix v2 future flags at your earliest convenience following [the official guide](https://remix.run/docs/en/1.15.0/pages/v2).

- Add an experimental `createWithCache_unstable` utility, which creates a function similar to `useQuery` from Hydrogen v1. Use this utility to query third-party APIs and apply custom cache options. ([#600](https://github.com/Shopify/hydrogen/pull/600)) by [@frandiox](https://github.com/frandiox)

  To setup the utility, update your `server.ts`:

  ```js
  import {
    createStorefrontClient,
    createWithCache_unstable,
    CacheLong,
  } from '@shopify/hydrogen';

  // ...

    const cache = await caches.open('hydrogen');
    const withCache = createWithCache_unstable({cache, waitUntil});

    // Create custom utilities to query third-party APIs:
    const fetchMyCMS = (query) => {
      // Prefix the cache key and make it unique based on arguments.
      return withCache(['my-cms', query], CacheLong(), () => {
        const cmsData = await (await fetch('my-cms.com/api', {
          method: 'POST',
          body: query
        })).json();

        const nextPage = (await fetch('my-cms.com/api', {
          method: 'POST',
          body: cmsData1.nextPageQuery,
        })).json();

        return {...cmsData, nextPage}
      });
    };

    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => ({
        session,
        waitUntil,
        storefront,
        env,
        fetchMyCMS,
      }),
    });
  ```

  **Note:** The utility is unstable and subject to change before stabalizing in the 2023.04 release.

- Adopt Remix [`v2_errorBoundary`](https://remix.run/docs/en/release-next/route/error-boundary-v2) future flag ([#729](https://github.com/Shopify/hydrogen/pull/729)) by [@wizardlyhel](https://github.com/wizardlyhel)

  ### `v2_errorBoundary` migration steps

  1. Remove all `CatchBoundary` route exports

  2. Handle route level errors with `ErrorBoundary`

     Before:

     ```jsx
     // app/root.tsx
     export function ErrorBoundary({error}: {error: Error}) {
       const [root] = useMatches();
       const locale = root?.data?.selectedLocale ?? DEFAULT_LOCALE;

       return (
         <html lang={locale.language}>
           <head>
             <title>Error</title>
             <Meta />
             <Links />
           </head>
           <body>
             <Layout layout={root?.data?.layout}>
               <GenericError error={error} />
             </Layout>
             <Scripts />
           </body>
         </html>
       );
     }
     ```

     After:

     ```jsx
     // app/root.tsx
     import {isRouteErrorResponse, useRouteError} from '@remix-run/react';

     export function ErrorBoundary({error}: {error: Error}) {
       const [root] = useMatches();
       const locale = root?.data?.selectedLocale ?? DEFAULT_LOCALE;
       const routeError = useRouteError();
       const isRouteError = isRouteErrorResponse(routeError);

       let title = 'Error';
       let pageType = 'page';

       // We have an route error
       if (isRouteError) {
         title = 'Not found';

         // We have a page not found error
         if (routeError.status === 404) {
           pageType = routeError.data || pageType;
         }
       }

       return (
         <html lang={locale.language}>
           <head>
             <title>{title}</title>
             <Meta />
             <Links />
           </head>
           <body>
             <Layout
               layout={root?.data?.layout}
               key={`${locale.language}-${locale.country}`}
             >
               {isRouteError ? (
                 <>
                   {routeError.status === 404 ? (
                     <NotFound type={pageType} />
                   ) : (
                     <GenericError
                       error={{
                         message: `${routeError.status} ${routeError.data}`,
                       }}
                     />
                   )}
                 </>
               ) : (
                 <GenericError
                   error={error instanceof Error ? error : undefined}
                 />
               )}
             </Layout>
             <Scripts />
           </body>
         </html>
       );
     }
     ```

- Updated dependencies [[`85ae63a`](https://github.com/Shopify/hydrogen/commit/85ae63ac37e5c4200919d8ae6c861c60effb4ded), [`5e26503`](https://github.com/Shopify/hydrogen/commit/5e2650374441fb5ae4840215fefdd5d547a378c0)]:
  - @shopify/hydrogen-react@2023.1.8

## 2023.1.6

### Patch Changes

- Add new `loader` API for setting seo tags within route module ([#591](https://github.com/Shopify/hydrogen/pull/591)) by [@cartogram](https://github.com/cartogram)

- `ShopPayButton` component now can receive a `storeDomain`. The component now does not require `ShopifyProvider`. ([#645](https://github.com/Shopify/hydrogen/pull/645)) by [@lordofthecactus](https://github.com/lordofthecactus)

- 1. Update Remix to 1.14.0 ([#599](https://github.com/Shopify/hydrogen/pull/599)) by [@blittle](https://github.com/blittle)

  1. Add `Cache-Control` defaults to all the demo store routes

- Added `robots` option to SEO config that allows users granular control over the robots meta tag. This can be set on both a global and per-page basis using the handle.seo property. ([#572](https://github.com/Shopify/hydrogen/pull/572)) by [@cartogram](https://github.com/cartogram)

  Example:

  ```ts
  export handle = {
    seo: {
      robots: {
        noIndex: false,
        noFollow: false,
      }
    }
  }
  ```

- Fix active cart session event in Live View ([#614](https://github.com/Shopify/hydrogen/pull/614)) by [@wizardlyhel](https://github.com/wizardlyhel)

  Introducing `getStorefrontHeaders` that collects the required Shopify headers for making a
  Storefront API call.

  - Make cart constants available as exports from `@shopify/hydrogen-react`
  - Deprecating `buyerIp` and `requestGroupId` props from `createStorefrontClient` from `@shopify/hydrogen`
  - Deprecating `getBuyerIp` function from `@shopify/remix-oxygen`

  ```diff
  + import {getStorefrontHeaders} from '@shopify/remix-oxygen';
  import {createStorefrontClient, storefrontRedirect} from '@shopify/hydrogen';

  export default {
    async fetch(
      request: Request,
      env: Env,
      executionContext: ExecutionContext,
    ): Promise<Response> {

      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
  -     buyerIp: getBuyerIp(request),
        i18n: {language: 'EN', country: 'US'},
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: `https://${env.PUBLIC_STORE_DOMAIN}`,
        storefrontApiVersion: env.PUBLIC_STOREFRONT_API_VERSION || '2023-01',
        storefrontId: env.PUBLIC_STOREFRONT_ID,
  -     requestGroupId: request.headers.get('request-id'),
  +     storefrontHeaders: getStorefrontHeaders(request),
      });
  ```

- Updated dependencies [[`c78f441`](https://github.com/Shopify/hydrogen/commit/c78f4410cccaf99d93b2a4e4fbd877fcaa2c1bce), [`7fca5d5`](https://github.com/Shopify/hydrogen/commit/7fca5d569be1d6749fdfa5ada6723d8186f0d775)]:
  - @shopify/hydrogen-react@2023.1.7

## 2023.1.5

### Patch Changes

- Fix the latest tag ([#562](https://github.com/Shopify/hydrogen/pull/562)) by [@blittle](https://github.com/blittle)

## 2023.1.4

### Patch Changes

- Fix template imports to only reference `@shopify/hydrogen`, not `@shopify/hydrogen-react` ([#523](https://github.com/Shopify/hydrogen/pull/523)) by [@blittle](https://github.com/blittle)

## 2023.1.3

### Patch Changes

- Send Hydrogen version in Storefront API requests. ([#471](https://github.com/Shopify/hydrogen/pull/471)) by [@frandiox](https://github.com/frandiox)

- Fix default Storefront type in LoaderArgs. ([#496](https://github.com/Shopify/hydrogen/pull/496)) by [@frandiox](https://github.com/frandiox)

## 2023.1.2

### Patch Changes

- Add license files and readmes for all packages ([#463](https://github.com/Shopify/hydrogen/pull/463)) by [@blittle](https://github.com/blittle)

## 2023.1.1

### Patch Changes

- Initial release
