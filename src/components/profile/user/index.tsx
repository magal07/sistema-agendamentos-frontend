import { FormEvent, useEffect, useState, useRef } from "react";
import {
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Spinner,
  Toast,
  ToastBody,
} from "reactstrap"; // <--- Importe Toast/ToastBody
import profileService from "../../../services/profileService";
import { useRouter } from "next/router";
import styles from "../../../../styles/profile.module.scss";

const UserForm = function () {
  const router = useRouter();

  // Estados dos Campos
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // Estados de UI
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastColor, setToastColor] = useState("");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone);
      setEmail(user.email);
      setInitialEmail(user.email);
      setCreatedAt(user.createdAt);

      if (user.avatarUrl) {
        setAvatarUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/${user.avatarUrl}`);
      }
    });
  }, []);

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    try {
      const updatedUser = await profileService.uploadAvatar(file);
      setAvatarUrl(
        `${process.env.NEXT_PUBLIC_BASE_URL}/${updatedUser.avatarUrl}`
      );

      setToastColor("bg-success");
      setToastMessage("Foto atualizada com sucesso!");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
    } catch (error) {
      setToastColor("bg-danger");
      setToastMessage("Erro ao enviar imagem.");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUpdating(true);

    try {
      await profileService.userUpdate({
        firstName,
        lastName,
        phone,
        email,
      });

      setToastColor("bg-success");
      setToastMessage("Dados atualizados com sucesso! Redirecionando...");
      setToastIsOpen(true);

      // --- REDIRECIONAMENTO ---
      setTimeout(() => {
        setToastIsOpen(false);
        // Se mudou o email, faz logout. Se não, vai para Home.
        if (email !== initialEmail) {
          sessionStorage.clear();
          router.push("/"); // Login/Landing
        } else {
          router.push("/home"); // <--- Ajuste aqui se sua rota principal for '/dashboard' ou outra
        }
      }, 2000); // Espera 2 segundos para o usuário ler a mensagem
    } catch (err) {
      setToastColor("bg-danger");
      setToastMessage("Erro ao atualizar dados.");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
      );
    }
    return (
      <div className={styles.avatarPlaceholder}>
        {firstName.slice(0, 1)}
        {lastName.slice(0, 1)}
      </div>
    );
  };

  return (
    <>
      <Form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.avatarContainer}>
          <div
            className={styles.avatarWrapper}
            onClick={() => fileInputRef.current?.click()}
          >
            {renderAvatar()}
            <div className={styles.avatarOverlay}>
              <span>Alterar</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        <div className={styles.formName}>
          <p className={styles.nameAbbreviation}>
            {firstName.slice(0, 1)}
            {lastName.slice(0, 1)}
          </p>
          <p className={styles.userName}>{`${firstName} ${lastName}`}</p>
        </div>

        <div className={styles.memberTime}>
          <img
            src="/profile/iconUserAccount.png"
            alt="iconLocal"
            className={styles.memberTimeImg}
          />
          <p className={styles.memberTimeText}>
            Conta criada <br />
            {new Date(createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <hr className={styles.hr} />

        <div className={styles.inputFlexDiv}>
          <FormGroup>
            <Label className={styles.label} for="firstName">
              NOME
            </Label>
            <Input
              name="firstName"
              type="text"
              id="firstName"
              placeholder="Qual o seu primeiro nome?"
              required
              maxLength={20}
              className={styles.input}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label className={styles.label} for="lastName">
              SOBRENOME
            </Label>
            <Input
              name="lastName"
              type="text"
              id="lastName"
              placeholder="Qual o seu último nome?"
              required
              maxLength={20}
              className={styles.input}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </FormGroup>
        </div>

        <div className={styles.inputFlexDiv}>
          <FormGroup>
            <Label className={styles.label} for="phone">
              WHATSAPP / CELULAR
            </Label>
            <Input
              name="phone"
              type="tel"
              id="phone"
              placeholder="(xx) 9xxxx-xxxx"
              required
              className={styles.input}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label className={styles.label} for="email">
              E-MAIL
            </Label>
            <Input
              name="email"
              type="email"
              id="email"
              placeholder="Coloque o seu email"
              required
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormGroup>
        </div>

        <Button className={styles.formBtn} outline type="submit">
          {isUpdating ? <Spinner size="sm" /> : "Salvar Alterações"}
        </Button>
      </Form>

      {/* --- AQUI ESTÁ O TOAST QUE FALTAVA --- */}
      <Toast
        isOpen={toastIsOpen}
        className={`${toastColor} text-white fixed-bottom ms-3 mb-3`}
        // fixed-bottom cola na parte inferior da tela
        // Se preferir no topo ou meio, ajuste as classes do Bootstrap
      >
        <ToastBody className="text-center">{toastMessage}</ToastBody>
      </Toast>
    </>
  );
};

export default UserForm;
