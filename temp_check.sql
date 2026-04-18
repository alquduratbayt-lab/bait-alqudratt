SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%video%' OR policyname LIKE '%Upload%' OR policyname LIKE '%all%';
