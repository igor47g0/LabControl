package com.labcontrol.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.labcontrol.exception.ConflictException;
import com.labcontrol.exception.ResourceNotFoundException;
import com.labcontrol.model.Equipamento;
import com.labcontrol.repository.EquipamentoRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EquipamentoServiceTest {

    @Mock
    private EquipamentoRepository equipamentoRepository;

    @InjectMocks
    private EquipamentoService equipamentoService;

    private Equipamento equipamento;

    @BeforeEach
    void setUp() {
        equipamento = new Equipamento(1L, "Microscópio Óptico Binocular", "PAT-00101", "Óptica", 5);
    }

    @Test
    @DisplayName("Deve cadastrar equipamento com sucesso")
    void deveCadastrarEquipamentoComSucesso() {
        when(equipamentoRepository.existsByNumeroPatrimonio("PAT-00101")).thenReturn(false);
        when(equipamentoRepository.save(any(Equipamento.class))).thenReturn(equipamento);

        Equipamento salvo = equipamentoService.cadastrar(equipamento);

        assertNotNull(salvo);
        assertEquals("PAT-00101", salvo.getNumeroPatrimonio());
        assertEquals("Microscópio Óptico Binocular", salvo.getNome());
        verify(equipamentoRepository, times(1)).existsByNumeroPatrimonio("PAT-00101");
        verify(equipamentoRepository, times(1)).save(any(Equipamento.class));
    }

    @Test
    @DisplayName("Deve lançar ConflictException ao cadastrar com patrimônio já existente")
    void deveLancarConflictAoCadastrarComPatrimonioExistente() {
        when(equipamentoRepository.existsByNumeroPatrimonio("PAT-00101")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            equipamentoService.cadastrar(equipamento);
        });

        assertTrue(exception.getMessage().contains("PAT-00101"));
        verify(equipamentoRepository, never()).save(any(Equipamento.class));
    }

    @Test
    @DisplayName("Deve listar todos os equipamentos")
    void deveListarTodosEquipamentos() {
        List<Equipamento> lista = Arrays.asList(
                equipamento,
                new Equipamento(2L, "Centrífuga Digital", "PAT-00102", "Centrífugas", 3)
        );
        when(equipamentoRepository.findAll()).thenReturn(lista);

        List<Equipamento> resultado = equipamentoService.listarTodos();

        assertEquals(2, resultado.size());
        verify(equipamentoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Deve buscar equipamento por ID existente")
    void deveBuscarPorIdExistente() {
        when(equipamentoRepository.findById(1L)).thenReturn(Optional.of(equipamento));

        Equipamento encontrado = equipamentoService.buscarPorId(1L);

        assertNotNull(encontrado);
        assertEquals(1L, encontrado.getId());
        assertEquals("Microscópio Óptico Binocular", encontrado.getNome());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException ao buscar ID inexistente")
    void deveLancarNotFoundAoBuscarIdInexistente() {
        when(equipamentoRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            equipamentoService.buscarPorId(99L);
        });

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    @DisplayName("Deve atualizar equipamento com sucesso")
    void deveAtualizarEquipamentoComSucesso() {
        Equipamento dadosNovos = new Equipamento("Microscópio Atualizado", "PAT-00101", "Óptica Avançada", 8);

        when(equipamentoRepository.findById(1L)).thenReturn(Optional.of(equipamento));
        when(equipamentoRepository.existsByNumeroPatrimonioAndIdNot("PAT-00101", 1L)).thenReturn(false);
        when(equipamentoRepository.save(any(Equipamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipamento atualizado = equipamentoService.atualizar(1L, dadosNovos);

        assertNotNull(atualizado);
        assertEquals("Microscópio Atualizado", atualizado.getNome());
        assertEquals("Óptica Avançada", atualizado.getCategoria());
        assertEquals(8, atualizado.getQuantidade());
        verify(equipamentoRepository, times(1)).save(equipamento);
    }

    @Test
    @DisplayName("Deve lançar ConflictException ao atualizar com patrimônio pertencente a outro equipamento")
    void deveLancarConflictAoAtualizarComPatrimonioEmUso() {
        Equipamento dadosNovos = new Equipamento("Microscópio", "PAT-00999", "Óptica", 5);

        when(equipamentoRepository.findById(1L)).thenReturn(Optional.of(equipamento));
        when(equipamentoRepository.existsByNumeroPatrimonioAndIdNot("PAT-00999", 1L)).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            equipamentoService.atualizar(1L, dadosNovos);
        });

        assertTrue(exception.getMessage().contains("PAT-00999"));
        verify(equipamentoRepository, never()).save(any(Equipamento.class));
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException ao atualizar ID inexistente")
    void deveLancarNotFoundAoAtualizarIdInexistente() {
        Equipamento dadosNovos = new Equipamento("Microscópio", "PAT-00101", "Óptica", 5);
        when(equipamentoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            equipamentoService.atualizar(99L, dadosNovos);
        });
    }

    @Test
    @DisplayName("Deve excluir equipamento com sucesso quando ID existe")
    void deveExcluirEquipamentoComSucesso() {
        when(equipamentoRepository.existsById(1L)).thenReturn(true);
        doNothing().when(equipamentoRepository).deleteById(1L);

        assertDoesNotThrow(() -> equipamentoService.excluir(1L));
        verify(equipamentoRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException ao excluir ID inexistente")
    void deveLancarNotFoundAoExcluirIdInexistente() {
        when(equipamentoRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            equipamentoService.excluir(99L);
        });

        assertTrue(exception.getMessage().contains("99"));
        verify(equipamentoRepository, never()).deleteById(anyLong());
    }
}
