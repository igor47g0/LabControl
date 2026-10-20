package com.labcontrol.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Objects;

@Entity
@Table(name = "equipamentos")
public class Equipamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 3, max = 100, message = "O nome deve ter entre 3 e 100 caracteres")
    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @NotBlank(message = "O número de patrimônio é obrigatório")
    @Column(name = "numero_patrimonio", nullable = false, unique = true, length = 50)
    private String numeroPatrimonio;

    @NotBlank(message = "A categoria é obrigatória")
    @Column(name = "categoria", nullable = false, length = 100)
    private String categoria;

    @NotNull(message = "A quantidade é obrigatória")
    @Min(value = 0, message = "A quantidade deve ser maior ou igual a 0")
    @Column(name = "quantidade", nullable = false)
    private Integer quantidade;

    public Equipamento() {
    }

    public Equipamento(Long id, String nome, String numeroPatrimonio, String categoria, Integer quantidade) {
        this.id = id;
        this.nome = nome;
        this.numeroPatrimonio = numeroPatrimonio;
        this.categoria = categoria;
        this.quantidade = quantidade;
    }

    public Equipamento(String nome, String numeroPatrimonio, String categoria, Integer quantidade) {
        this.nome = nome;
        this.numeroPatrimonio = numeroPatrimonio;
        this.categoria = categoria;
        this.quantidade = quantidade;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getNumeroPatrimonio() {
        return numeroPatrimonio;
    }

    public void setNumeroPatrimonio(String numeroPatrimonio) {
        this.numeroPatrimonio = numeroPatrimonio;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Equipamento that = (Equipamento) o;
        return Objects.equals(id, that.id) && Objects.equals(numeroPatrimonio, that.numeroPatrimonio);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, numeroPatrimonio);
    }

    @Override
    public String toString() {
        return "Equipamento{" +
                "id=" + id +
                ", nome='" + nome + '\'' +
                ", numeroPatrimonio='" + numeroPatrimonio + '\'' +
                ", categoria='" + categoria + '\'' +
                ", quantidade=" + quantidade +
                '}';
    }
}
