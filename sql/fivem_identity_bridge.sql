CREATE TABLE IF NOT EXISTS `fivem_identities` (
    `identifier` VARCHAR(191) NOT NULL,
    `account_login` VARCHAR(64) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identifier`),
    UNIQUE KEY `uq_fivem_identities_account` (`account_login`)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
