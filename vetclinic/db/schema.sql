CREATE DATABASE IF NOT EXISTS vetclinic CHARACTER SET utf8mb4;
USE vetclinic;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS tutores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cpf_cifrado VARCHAR(255) NOT NULL,      -- AES-256-GCM (ilegível no banco)
  cpf_hash CHAR(64) NOT NULL UNIQUE,      -- HMAC-SHA256 (evita CPF duplicado)
  telefone VARCHAR(20),
  email VARCHAR(120),
  INDEX idx_tutores_nome (nome)
);

CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  especie VARCHAR(40) NOT NULL,
  raca VARCHAR(60),
  tutor_id INT NOT NULL,                  -- todo pet tem tutor
  CONSTRAINT fk_pet_tutor FOREIGN KEY (tutor_id) REFERENCES tutores(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  data_agendamento DATETIME NOT NULL,
  motivo VARCHAR(200),
  CONSTRAINT fk_ag_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  INDEX idx_ag_data (data_agendamento)
);
