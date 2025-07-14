export const idlFactory = ({ IDL }) => {
  const Family = IDL.Record({
    'members' : IDL.Vec(IDL.Text),
    'creator_id' : IDL.Text,
    'name' : IDL.Text,
    'family_id' : IDL.Text,
  });
  return IDL.Service({
    'add_member_to_family' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'create_family' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text })],
        [],
      ),
    'get_family' : IDL.Func([IDL.Text], [IDL.Opt(Family)], []),
  });
};
export const init = ({ IDL }) => { return []; };
