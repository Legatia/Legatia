import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Family {
  'members' : Array<string>,
  'creator_id' : string,
  'name' : string,
  'family_id' : string,
}
export interface _SERVICE {
  'add_member_to_family' : ActorMethod<
    [string, string, string],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'create_family' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'get_family' : ActorMethod<[string], [] | [Family]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
