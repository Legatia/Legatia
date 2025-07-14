import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Invite {
  'is_used' : boolean,
  'creator_id' : string,
  'code' : string,
  'family_id' : string,
}
export interface _SERVICE {
  'create_invite' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_invite' : ActorMethod<[string], [] | [Invite]>,
  'use_invite' : ActorMethod<[string], { 'Ok' : string } | { 'Err' : string }>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
