import { useMutation, useQuery } from 'react-query';
import { queryClient } from './base';
import { getAll } from 'src/utilities/getAll';
import { Event } from '@linode/api-v4/lib/account/types';
import {
  APIError,
  Filter,
  Params,
  ResourcePage,
} from '@linode/api-v4/lib/types';
import {
  cloneDomain,
  createDomain,
  CreateDomainPayload,
  deleteDomain,
  Domain,
  getDomains,
  updateDomain,
  UpdateDomainPayload,
  CloneDomainPayload,
  getDomain,
  ImportZonePayload,
  importZone,
  getDomainRecords,
  DomainRecord,
} from '@linode/api-v4/lib/domains';

export const queryKey = 'domains';

export const useDomainsQuery = (params: Params, filter: Filter) =>
  useQuery<ResourcePage<Domain>, APIError[]>(
    [queryKey, 'paginated', params, filter],
    () => getDomains(params, filter),
    { keepPreviousData: true }
  );

export const useAllDomainsQuery = (enabled: boolean = false) =>
  useQuery<Domain[], APIError[]>([queryKey, 'all'], getAllDomains, {
    enabled,
  });

export const useDomainQuery = (id: number) =>
  useQuery<Domain, APIError[]>([queryKey, 'domain', id], () => getDomain(id));

export const useDomainRecordsQuery = (id: number) =>
  useQuery<DomainRecord[], APIError[]>(
    [queryKey, 'domain', id, 'records'],
    () => getAllDomainRecords(id)
  );

export const useCreateDomainMutation = () =>
  useMutation<Domain, APIError[], CreateDomainPayload>(createDomain, {
    onSuccess: (domain) => {
      queryClient.invalidateQueries([queryKey, 'paginated']);
      queryClient.setQueryData([queryKey, 'domain', domain.id], domain);
    },
  });

export const useCloneDomainMutation = (id: number) =>
  useMutation<Domain, APIError[], CloneDomainPayload>(
    (data) => cloneDomain(id, data),
    {
      onSuccess: (domain) => {
        queryClient.invalidateQueries([queryKey, 'paginated']);
        queryClient.setQueryData([queryKey, 'domain', domain.id], domain);
      },
    }
  );

export const useImportZoneMutation = () =>
  useMutation<Domain, APIError[], ImportZonePayload>(
    (data) => importZone(data),
    {
      onSuccess: (domain) => {
        queryClient.invalidateQueries([queryKey, 'paginated']);
        queryClient.setQueryData([queryKey, 'domain', domain.id], domain);
      },
    }
  );

export const useDeleteDomainMutation = (id: number) =>
  useMutation<{}, APIError[]>(() => deleteDomain(id), {
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey, 'paginated']);
      queryClient.removeQueries([queryKey, 'domain', id]);
    },
  });

export const useUpdateDomainMutation = () =>
  useMutation<Domain, APIError[], { id: number } & UpdateDomainPayload>(
    (data) => {
      const { id, ...rest } = data;
      return updateDomain(id, rest);
    },
    {
      onSuccess: (domain) => {
        queryClient.invalidateQueries([queryKey, 'paginated']);
        queryClient.setQueryData<Domain>(
          [queryKey, 'domain', domain.id],
          domain
        );
      },
    }
  );

export const domainEventsHandler = (event: Event) => {
  // Invalidation is agressive beacuse it will invalidate on every domain event, but
  // it is worth it for the UX benefits. We can fine tune this later if we need to.
  queryClient.invalidateQueries([queryKey]);
};

export const getAllDomains = () =>
  getAll<Domain>((params) => getDomains(params))().then((data) => data.data);

const getAllDomainRecords = (domainId: number) =>
  getAll<DomainRecord>((params) => getDomainRecords(domainId, params))().then(
    ({ data }) => data
  );
