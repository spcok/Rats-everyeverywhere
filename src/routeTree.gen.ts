/* eslint-disable */
// @ts-nocheck
import { Route as rootRoute } from './routes/__root';
import { Route as PairingsImport } from './routes/pairings';
import { Route as RatsImport } from './routes/rats';
import { Route as IndexImport } from './routes/index';

const PairingsRoute = PairingsImport.update({
  id: '/pairings',
  path: '/pairings',
  getParentRoute: () => rootRoute,
} as any);

const RatsRoute = RatsImport.update({
  id: '/rats',
  path: '/rats',
  getParentRoute: () => rootRoute,
} as any);

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any);

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/';
      path: '/';
      fullPath: '/';
      preLoaderRoute: typeof IndexImport;
      parentRoute: typeof rootRoute;
    };
    '/pairings': {
      id: '/pairings';
      path: '/pairings';
      fullPath: '/pairings';
      preLoaderRoute: typeof PairingsImport;
      parentRoute: typeof rootRoute;
    };
    '/rats': {
      id: '/rats';
      path: '/rats';
      fullPath: '/rats';
      preLoaderRoute: typeof RatsImport;
      parentRoute: typeof rootRoute;
    };
  }
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  PairingsRoute: typeof PairingsRoute;
  RatsRoute: typeof RatsRoute;
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  PairingsRoute: PairingsRoute,
  RatsRoute: RatsRoute,
};

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<any>();