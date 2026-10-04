import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * React Compiler chua duoc bat runtime (next.config.ts khong co `compiler`),
 * nhung eslint-config-next van ship cac rule cua no. Day la rule aspirational -
 * noi dung san sang cho compiler chu khong anh huong hanh vi hien tai, nen ha
 * xuong `warn` de khong chan gate lint.
 *
 * Gap rat ro rang o cac component animation (StreetPets, ParticleEngine...) -
 * goi impure/refs trong render la co tinh de ve duong va mot han trinh render.
 * Khi nao bat React Compiler thi phai sua han, luc do day la error.
 *
 * `react-hooks/rules-of-hooks` KHONG ha - do la rule that, van bat true bug.
 */
const reactCompilerAsWarn = {
  files: ['**/*.{js,jsx,ts,tsx,mjs}'],
  rules: {
    'react-hooks/purity': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/static-components': 'warn',
  },
};

const ignoreUnderscore = {
  files: ['**/*.{js,jsx,ts,tsx,mjs}'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
  },
};

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'tsconfig.tsbuildinfo',
      'next-env.d.ts',
      '**/*.d.ts',
    ],
  },
  ...nextVitals,
  ...nextTs,
  ignoreUnderscore,
  reactCompilerAsWarn,
];
