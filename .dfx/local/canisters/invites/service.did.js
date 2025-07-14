export const idlFactory = ({ IDL }) => {
  const Invite = IDL.Record({
    'is_used' : IDL.Bool,
    'creator_id' : IDL.Text,
    'code' : IDL.Text,
    'family_id' : IDL.Text,
  });
  return IDL.Service({
    'create_invite' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_invite' : IDL.Func([IDL.Text], [IDL.Opt(Invite)], []),
    'use_invite' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
