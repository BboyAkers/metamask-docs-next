import fs from 'fs';
import { promisify } from 'util';
import _glob from 'glob';
import matter from 'gray-matter';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const glob = promisify(_glob);

export interface Page {
  slug: string[];
  path: string;
  route: string;
  meta: PageMeta;
  content: string;
}

export interface PageMeta {
  title: string;
  date: string;
  order: number;
}

export const getPage = async (pagePath: string): Promise<Page> => {
  const content = await readFile(pagePath, 'utf8');

  const result = matter(content);
  const route = pagePath.replace('.mdx', '').replace('content/', '');

  return {
    slug: route.split('/'),
    path: pagePath,
    route,
    meta: result.data as PageMeta,
    content: result.content,
  };
};

export const getPageForSlug = async (slug: string[]): Promise<Page> => {
  const path = `content/${slug.join('/')}.mdx`;
  return getPage(path);
};

export const getPages = async (): Promise<Page[]> => {
  const pagePaths = await glob('content/**/*.mdx');
  const pages = [];
  for (const pagePath of pagePaths) {
    pages.push(await getPage(pagePath));
  }

  pages.sort((a, b) => {
    if (a.meta.order > b.meta.order) {
      return 1;
    } else if (a.meta.order === b.meta.order) {
      return 0;
    }
    return -1;
  });

  return pages;
};

export const listPages = async (): Promise<any> => {
  return (await getPages()).map((page: Page) => {
    return {
      params: {
        slug: page.slug,
      },
    };
  });
};

export interface TOCGroup {
  title: string;
  order: number;
  items: TOCItem[];
}

export interface TOCItem {
  title: string;
  route: string;
}

const getGroups = async () => {
  const files = await readdir('content', { withFileTypes: true });
  const groups = files.filter((f) => f.isDirectory()).map((f) => f.name);

  const noMeta = [];
  const withMeta = [];
  for (const group of groups) {
    try {
      const c = await readFile(`content/${group}/meta.json`, 'utf8');
      try {
        const m = JSON.parse(c); // todo: validate against schema
        m.items = [];
        withMeta.push(m);
      } catch (e) {
        console.error(
          `Invalid JSON :: Could not parse meta file for group: ${group}.`,
        );
        throw e;
      }
    } catch (e) {
      noMeta.push(group);
    }
  }

  if (noMeta.length > 0) {
    noMeta.forEach((group, idx) => {
      withMeta.push({
        title: group,
        order: withMeta.length + idx,
        pathPrefix: group,
        items: [],
      });
    });
  }
  return withMeta;
};

export const getTOC = async (): Promise<TOCGroup[]> => {
  const pages = await getPages();
  const groups = await getGroups();

  pages.forEach((p) => {
    const groupPathPrefix = p.slug[0];
    const g = groups.find((gg) => gg.pathPrefix === groupPathPrefix);
    g.items.push({
      title: p.meta.title,
      route: p.route,
    });
  });

  groups.sort((a, b) => {
    if (a.order > b.order) {
      return 1;
    }

    if (a.order === b.order) {
      return 0;
    }
    return -1;
  });

  return groups;
};
