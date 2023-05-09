#!/usr/bin/env node

import { config } from 'dotenv';
import { parse } from 'json5';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { ITemplatesItem, IGroup } from './interfaces';

config();

const ROOT_FOLDER = resolve(__dirname, '..');
const BUILD_FOLDER = resolve(ROOT_FOLDER, 'build');
const templatesFile = resolve(ROOT_FOLDER, 'templates.json');

const { CI_BASE_URL = 'https://raw.githubusercontent.com/4d/Web-studio-TIPS/develop' } = process.env;

const templates: ITemplatesItem[] = parse(readFileSync(templatesFile, 'utf-8'));

const result = templates.map(({ path, ...item }) => {
  const groupManifestPath = resolve(ROOT_FOLDER, path);
  const groupPath = dirname(groupManifestPath);

  const group: IGroup = parse(readFileSync(groupManifestPath, 'utf-8'));

  const components = group.components.map(({ data, ...component }) => {
    const content = readFileSync(resolve(groupPath, data), 'utf-8');

    return {
      ...component,
      data: parse(content.replace(/__BASE__URL__/g, CI_BASE_URL)),
    };
  });

  const gName = item.group
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase())
    .join('-');

  writeFileSync(resolve(BUILD_FOLDER, `${gName}.json`), JSON.stringify(components, null, 2));

  return {
    ...item,
    link: `${CI_BASE_URL}/${relative(ROOT_FOLDER, BUILD_FOLDER)}/${gName}.json`,
  };
});

writeFileSync(resolve(BUILD_FOLDER, 'index.json'), JSON.stringify(result, null, 2));
