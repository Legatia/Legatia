import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Profile {
  'name' : string,
  'surname' : string,
  'user_id' : string,
  'email' : string,
  'family_id' : [] | [string],
}
export interface _SERVICE {
  'create_profile' : ActorMethod<
    [string, string, string, [] | [string], [] | [string]],
    { 'Ok' : Profile } |
      { 'Err' : string }
  >,
  'get_profile' : ActorMethod<[string], [] | [Profile]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
