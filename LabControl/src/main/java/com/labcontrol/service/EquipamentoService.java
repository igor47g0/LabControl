package com.labcontrol.service;

import com.labcontrol.exception.ConflictException;
import com.labcontrol.exception.ResourceNotFoundException;
import com.labcontrol.model.Equipamento;
import com.labcontrol.repository.EquipamentoRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipamentoService {

    private final EquipamentoRepository equipamentoRepository;

    public EquipamentoService(EquipamentoRepository equipamentoRepository) {
        this.equipamentoRepository = equipamentoRepository;
    }

    /**
     * Retorna a lista completa de equipamentos cadastrados.
     */
    @Transactional(readOnly = true)
    public List<Equipamento> listarTodos() {
        return equipamentoRepository.findAll();
    }

    /**
     * Busca um equipamento por ID.
     * Lança ResourceNotFoundException se não for encontrado.
     */
    @Transactional(readOnly = true)
    public Equipamento buscarPorId(Long id) {
        return equipamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com o ID: " + id));
    }

    /**
     * Cadastra um novo equipamento validando unicidade do número de patrimônio.
     * Lança ConflictException se o patrimônio já estiver em uso.
     */
    @Transactional
    public Equipamento cadastrar(Equipamento equipamento) {
        if (equipamentoRepository.existsByNumeroPatrimonio(equipamento.getNumeroPatrimonio())) {
            throw new ConflictException(
                    "Já existe um equipamento cadastrado com o número de patrimônio: " + equipamento.getNumeroPatrimonio()
            );
        }

        // Garante que será gerado um novo ID pelo banco
        equipamento.setId(null);
        return equipamentoRepository.save(equipamento);
    }

    /**
     * Atualiza os dados de um equipamento existente.
     * Lança ResourceNotFoundException se o ID não existir.
     * Lança ConflictException se o número de patrimônio já pertencer a outro equipamento.
     */
    @Transactional
    public Equipamento atualizar(Long id, Equipamento dadosAtualizados) {
        Equipamento equipamentoExistente = buscarPorId(id);

        if (equipamentoRepository.existsByNumeroPatrimonioAndIdNot(dadosAtualizados.getNumeroPatrimonio(), id)) {
            throw new ConflictException(
                    "Já existe outro equipamento cadastrado com o número de patrimônio: " + dadosAtualizados.getNumeroPatrimonio()
            );
        }

        equipamentoExistente.setNome(dadosAtualizados.getNome());
        equipamentoExistente.setNumeroPatrimonio(dadosAtualizados.getNumeroPatrimonio());
        equipamentoExistente.setCategoria(dadosAtualizados.getCategoria());
        equipamentoExistente.setQuantidade(dadosAtualizados.getQuantidade());

        return equipamentoRepository.save(equipamentoExistente);
    }

    /**
     * Remove um equipamento por ID.
     * Lança ResourceNotFoundException se o ID não existir.
     */
    @Transactional
    public void excluir(Long id) {
        if (!equipamentoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipamento não encontrado com o ID: " + id);
        }
        equipamentoRepository.deleteById(id);
    }
}
