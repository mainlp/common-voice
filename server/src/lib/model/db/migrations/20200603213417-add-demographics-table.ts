export const up = async function (db: any): Promise<any> {
  return db.runSql(
    `
      CREATE TABLE ages (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        age VARCHAR(255) NOT NULL
      );
      CREATE TABLE genders (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        gender VARCHAR(255) NOT NULL
      );

      CREATE TABLE demographics (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        client_id CHAR(36) NOT NULL,
        age TINYINT UNSIGNED NOT NULL,
        age_id BIGINT(20) UNSIGNED,
        gender_id BIGINT(20) UNSIGNED,
        gender CHAR(1),
        region VARCHAR(30),
        updated_at DATETIME DEFAULT now(),
        FOREIGN KEY (client_id) REFERENCES user_clients (client_id),
        FOREIGN KEY (age_id) REFERENCES ages (id),
        FOREIGN KEY (gender_id) REFERENCES genders (id),
        UNIQUE (client_id)
      );
      CREATE TABLE clip_demographics (
        clip_id BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY,
        demographic_id BIGINT(20) UNSIGNED NOT NULL,
        FOREIGN KEY (clip_id) REFERENCES clips (id),
        FOREIGN KEY (demographic_id) REFERENCES demographics (id)
      );
      ALTER TABLE user_clients
        CHANGE COLUMN age deprecated_age VARCHAR(255),
        CHANGE COLUMN gender deprecated_gender VARCHAR(255);
      INSERT INTO ages (age) VALUES
        ('teens'),
        ('twenties'),
        ('thirties'),
        ('fourties'),
        ('fifties'),
        ('sixties'),
        ('seventies'),
        ('eighties'),
        ('nineties');
      /* Gender exists across a spectrum which is not adequately represented in
         our current database schema.
         Including demographic data with our dataset is necessary to ensure its
         utility to researchers, and helps us track the fullness and inclusion
         of our collection process. We will ALWAYS keep this field optional. We
         only store records for users who opt in, and will always (at very
         least) maintain an "Other" option.
      */
      INSERT INTO genders (gender) VALUES ('female'), ('male'), ('other');

      INSERT INTO clip_demographics (clip_id, demographic_id)  (
        SELECT clips.id AS clip_id, demographics.id AS demographic_id
        FROM clips
        INNER JOIN demographics ON clips.client_id = demographics.client_id
      );
    `
  );
};
export const down = function (): Promise<any> {
  return null;
};
