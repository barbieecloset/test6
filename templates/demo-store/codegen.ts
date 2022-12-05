import type {CodegenConfig} from '@graphql-codegen/cli';
import {storefrontApiCustomScalars} from '@shopify/hydrogen-react';

const config: CodegenConfig = {
  overwrite: true,
  // schema needs a relative path, so we use require.resolve() to generate that for us nicely.
  // @ts-expect-error TS complains about install the node types here, but it doesn't make sense to configure this whole project to use node types when only this file does.
  schema: require.resolve('@shopify/hydrogen-react/storefront.schema.json'),
  documents: './app/{routes,data}/*.{gql,graphql,tsx,ts}',
  generates: {
    'app/': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.generated.ts',
        // `baseTypesPath` can take in the path to a node module by prefixing `~`
        // We don't need graphql-codegen to generate a new base types file when hydrogen-react already did that for us
        baseTypesPath: '~@shopify/hydrogen-react/storefront-api-types',
      },
      plugins: [
        'typescript-operations',
        {
          add: {
            content: `
              /**
              * This file is automatically generated. Do not modify directly; instead, update the associated query that lives next to this file and run the \`codegen\` script again.
              **/
          `,
          },
        },
      ],
      config: {
        // tells 'typescript-operations' to use the custom scalars hydrogen-react uses for the SFAPI, for the generated files. Instead of using `any`
        scalars: storefrontApiCustomScalars,
      },
    },
  },
  hooks: {
    // cleanup the generated files with prettier
    afterAllFileWrite: ['npm run format'],
  },
};

export default config;