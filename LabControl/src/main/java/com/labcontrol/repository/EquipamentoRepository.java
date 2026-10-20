package com.labcontrol.repository;

import com.labcontrol.model.Equipamento;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipamentoRepository extends JpaRepository<Equipamento, Long> {

    /**
     * Verifica se já existe um equipamento cadastrado com o número de patrimônio informado.
     * Utilizado na validação de unicidade durante o cadastro.
     */
    boolean existsByNumeroPatrimonio(String numeroPatrimonio);

    /**
     * Verifica se já existe outro equipamento com o mesmo número de patrimônio diferente do ID informado.
     * Utilizado na validação de unicidade durante a atualização.
     */
    boolean existsByNumeroPatrimonioAndIdNot(String numeroPatrimonio, Long id);

    /**
     * Busca um equipamento pelo número de patrimônio único.
     */
    Optional<Equipamento> findByNumeroPatrimonio(String numeroPatrimonio);

    /**
     * Busca equipamentos pela categoria ignorando maiúsculas e minúsculas.
     */
    List<Equipamento> findByCategoriaIgnoreCase(String categoria);

    /**
     * Busca equipamentos cujo nome contenha o termo informado.
     */
    List<Equipamento> findByNomeContainingIgnoreCase(String nome);
}
