-- Phase 5 verified location updates only. Review and obtain approval before applying.
-- Source: data/restaurant-locations.json; official location evidence checked 2026-10-28.
-- No restaurant identity, user content, prices, hours, photos or rating logic is changed.
begin;

do $$
declare
  location record;
  current_row public.restaurants%rowtype;
begin
  for location in
    select * from (values
      ('sinchon-05', '소바연구소', '서울 서대문구 명물길 50-9 (창천동)', 37.5587750739815::double precision, 126.939459409798::double precision, 'https://korean.visitseoul.net/area/SobaLabSinchon/KOP1kjvs6'),
      ('sinchon-08', '꼬숑돈까스', '서울 서대문구 명물1길 2 (창천동)', 37.557838918578::double precision, 126.937349643274::double precision, 'https://korean.visitseoul.net/restaurants/CochonTonkatsu/KOPf7618z')
    ) as verified(id, name, address, latitude, longitude, source_url)
    order by id
  loop
    select * into current_row from public.restaurants where id = location.id for update;
    if not found or current_row.name is distinct from location.name then
      raise exception 'Approved restaurant ID/name mismatch for %', location.id;
    end if;
    if (current_row.address is not null and current_row.address is distinct from location.address)
      or (current_row.latitude is not null and current_row.latitude is distinct from location.latitude)
      or (current_row.longitude is not null and current_row.longitude is distinct from location.longitude) then
      raise exception 'Existing location conflicts with verified evidence for %', location.id;
    end if;

    -- Change only missing/identical location fields. Preserve existing source and
    -- full-verification date: location evidence does not verify every detail.
    update public.restaurants set
      address = location.address,
      latitude = location.latitude,
      longitude = location.longitude,
      source_url = coalesce(current_row.source_url, location.source_url),
      verification_status = case when current_row.verification_status = 'pending' then 'partial' else current_row.verification_status end
    where id = location.id and (
      address is distinct from location.address
      or latitude is distinct from location.latitude
      or longitude is distinct from location.longitude
      or source_url is null
      or verification_status = 'pending'
    );
  end loop;
end
$$;

commit;
