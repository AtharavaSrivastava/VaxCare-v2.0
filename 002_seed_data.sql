-- Seed data for standard vaccines
INSERT INTO standard_vaccines (name, recommended_age, description, sequence_order, is_mandatory) VALUES
('BCG', 'At birth', 'Protection against tuberculosis', 1, true),
('Hepatitis B (1st dose)', 'At birth', 'First dose of Hepatitis B vaccine', 2, true),
('OPV (0 dose)', 'At birth', 'Oral Polio Vaccine', 3, true),
('Hepatitis B (2nd dose)', '6 weeks', 'Second dose of Hepatitis B vaccine', 4, true),
('DTaP (1st dose)', '6 weeks', 'Diphtheria, Tetanus, Pertussis', 5, true),
('IPV (1st dose)', '6 weeks', 'Inactivated Polio Vaccine', 6, true),
('Hib (1st dose)', '6 weeks', 'Haemophilus influenzae type b', 7, true),
('Rotavirus (1st dose)', '6 weeks', 'Protection against rotavirus', 8, true),
('PCV (1st dose)', '6 weeks', 'Pneumococcal Conjugate Vaccine', 9, true),
('DTaP (2nd dose)', '10 weeks', 'Diphtheria, Tetanus, Pertussis', 10, true),
('IPV (2nd dose)', '10 weeks', 'Inactivated Polio Vaccine', 11, true),
('Hib (2nd dose)', '10 weeks', 'Haemophilus influenzae type b', 12, true),
('Rotavirus (2nd dose)', '10 weeks', 'Protection against rotavirus', 13, true),
('PCV (2nd dose)', '10 weeks', 'Pneumococcal Conjugate Vaccine', 14, true),
('DTaP (3rd dose)', '14 weeks', 'Diphtheria, Tetanus, Pertussis', 15, true),
('IPV (3rd dose)', '14 weeks', 'Inactivated Polio Vaccine', 16, true),
('Hib (3rd dose)', '14 weeks', 'Haemophilus influenzae type b', 17, true),
('Rotavirus (3rd dose)', '14 weeks', 'Protection against rotavirus', 18, true),
('PCV (3rd dose)', '14 weeks', 'Pneumococcal Conjugate Vaccine', 19, true),
('MMR (1st dose)', '9-12 months', 'Measles, Mumps, Rubella', 20, true),
('Varicella (Chickenpox)', '12-15 months', 'Protection against chickenpox', 21, true),
('Hepatitis A (1st dose)', '12-23 months', 'First dose of Hepatitis A vaccine', 22, true),
('MMR (2nd dose)', '4-6 years', 'Measles, Mumps, Rubella booster', 23, true),
('DTaP (Booster)', '4-6 years', 'Diphtheria, Tetanus, Pertussis booster', 24, true),
('IPV (Booster)', '4-6 years', 'Polio booster', 25, true),
('HPV (1st dose)', '11-12 years', 'Human Papillomavirus vaccine', 26, true),
('Tdap (Booster)', '11-12 years', 'Tetanus, Diphtheria, Pertussis booster', 27, true);

-- Sample vaccine drives
INSERT INTO vaccine_drives (title, description, drive_type, location, address, drive_date, start_time, end_time, organizer, contact_info) VALUES
('Free Polio Vaccination Camp', 'Free polio vaccination for children under 5 years', 'vaccine', 'City General Hospital', '123 Health Street, Downtown', '2025-11-15', '09:00:00', '16:00:00', 'City Health Department', 'health@city.gov'),
('Child Safety Workshop', 'Educational workshop on child safety and accident prevention', 'safety', 'Community Center, Downtown', '456 Community Ave, Downtown', '2025-11-20', '10:00:00', '14:00:00', 'Child Safety Foundation', 'info@childsafety.org'),
('MMR Vaccination Drive', 'Measles, Mumps, Rubella vaccination drive', 'vaccine', 'District Health Center', '789 Medical Plaza, District 1', '2025-11-25', '08:00:00', '17:00:00', 'District Health Authority', 'vaccines@district.health'),
('Hepatitis B Awareness Camp', 'Free Hepatitis B vaccination and awareness program', 'vaccine', 'Regional Medical College', '321 University Road, Medical Campus', '2025-12-01', '09:00:00', '15:00:00', 'Medical College Outreach', 'outreach@medcollege.edu'),
('Infant Care Workshop', 'Workshop on newborn care and vaccination importance', 'safety', 'Maternity Hospital', '654 Mother Care Street, Health District', '2025-12-05', '11:00:00', '16:00:00', 'Maternal Health Society', 'care@maternal.org');